import assert from "node:assert/strict";
import test from "node:test";
import { calculateAccountBalance, calculateCommitments, calculateIncomeBudgetRows, calculateRemainingIncomeForMonth, consumeReservation, nextRecurringDate, transferFeeFor } from "../lib/finance-math.ts";

const base = {
  month: "2026-11", liquidMinor: 100_000, safetyMinor: 0, budgets: [],
  expenseSpendByCategory: new Map<string, number>(), obligations: [], obligationOccurrences: [],
  goalSpendByCategory: new Map<string, number>(),
  obligationPayments: [], goals: [], goalContributions: [],
};

test("recurrencias conservan correctamente el fin de mes", () => {
  assert.equal(nextRecurringDate("2026-01-31", "monthly"), "2026-02-28");
  assert.equal(nextRecurringDate("2028-01-31", "monthly"), "2028-02-29");
  assert.equal(nextRecurringDate("2028-02-29", "yearly"), "2029-02-28");
});

test("el saldo excluye movimientos futuros y anteriores al corte", () => {
  const transactions = [
    { type: "income", accountId: "a", destinationAccountId: null, amountMinor: 1000, occurredOn: "2026-10-31", status: "confirmed" },
    { type: "income", accountId: "a", destinationAccountId: null, amountMinor: 2000, occurredOn: "2026-11-10", status: "confirmed" },
    { type: "expense", accountId: "a", destinationAccountId: null, amountMinor: 300, occurredOn: "2026-12-01", status: "confirmed" },
  ];
  assert.equal(calculateAccountBalance("a", 5000, "2026-11-01", "2026-11-18", transactions), 7000);
});

test("un gasto por transferencia descuenta importe y comisión de la cuenta", () => {
  const transactions = [
    { type: "expense", accountId: "a", destinationAccountId: null, amountMinor: 10_000, feeMinor: 250, occurredOn: "2026-11-18", status: "confirmed" },
  ];
  assert.equal(calculateAccountBalance("a", 50_000, "2026-11-01", "2026-11-18", transactions), 39_750);
});

test("una obligación crea presupuesto aunque no exista asignación manual", () => {
  const result = calculateCommitments({ ...base, obligations: [{ id: "o", kind: "expense", active: true, reservedMinor: 0, categoryId: "luz", coveredByBudget: true, reserveMonth: "" }], obligationOccurrences: [{ id: "v", obligationId: "o", dueDate: "2026-11-25", expectedMinor: 5000, paidMinor: 0, status: "pending" }] });
  assert.equal(result.budgetRows[0].effectiveAssignedMinor, 5000);
  assert.equal(result.committedMinor, 5000);
});

test("presupuesto y obligación no se suman dos veces", () => {
  const common = { ...base, obligations: [{ id: "o", kind: "expense", active: true, reservedMinor: 0, categoryId: "luz", coveredByBudget: true, reserveMonth: "" }], obligationOccurrences: [{ id: "v", obligationId: "o", dueDate: "2026-11-25", expectedMinor: 5000, paidMinor: 0, status: "pending" }] };
  assert.equal(calculateCommitments({ ...common, budgets: [{ categoryId: "luz", assignedMinor: 5000 }] }).committedMinor, 5000);
  assert.equal(calculateCommitments({ ...common, budgets: [{ categoryId: "luz", assignedMinor: 10_000 }] }).committedMinor, 10_000);
});

test("un pago consume la provisión sin volver a comprometerlo", () => {
  const result = calculateCommitments({ ...base, expenseSpendByCategory: new Map([["luz", 5000]]), obligations: [{ id: "o", kind: "expense", active: true, reservedMinor: 0, categoryId: "luz", coveredByBudget: true, reserveMonth: "" }], obligationOccurrences: [{ id: "v", obligationId: "o", dueDate: "2026-11-10", expectedMinor: 5000, paidMinor: 5000, status: "paid" }], obligationPayments: [{ occurrenceId: "v", amountMinor: 5000, occurredOn: "2026-11-10", status: "confirmed" }] });
  assert.equal(result.budgetRows[0].effectiveAssignedMinor, 5000);
  assert.equal(result.budgetRows[0].remainingMinor, 0);
  assert.equal(result.committedMinor, 0);
});

test("reservas para otro mes siguen comprometidas", () => {
  const result = calculateCommitments({ ...base, obligations: [{ id: "o", kind: "expense", active: true, reservedMinor: 2500, categoryId: "luz", coveredByBudget: true, reserveMonth: "2026-11" }], obligationOccurrences: [{ id: "v", obligationId: "o", dueDate: "2026-12-10", expectedMinor: 5000, paidMinor: 0, status: "pending" }] });
  assert.equal(result.obligationReservedMinor, 2500);
  assert.equal(result.committedMinor, 2500);
});

test("un aporte a meta amplía el presupuesto sin consumir la asignación previa", () => {
  const result = calculateCommitments({ ...base, budgets: [{ categoryId: "compra", assignedMinor: 10_000 }], goals: [{ id: "g", status: "funded", reservedMinor: 3000, categoryId: "compra", coveredByBudget: true }], goalContributions: [{ goalId: "g", amountMinor: 3000, occurredOn: "2026-11-12" }] });
  assert.equal(result.budgetRows[0].effectiveAssignedMinor, 13_000);
  assert.equal(result.budgetRows[0].goalAllocatedMinor, 3000);
  assert.equal(result.budgetRemainingMinor, 10_000);
  assert.equal(result.goalReservedMinor, 3000);
  assert.equal(result.committedMinor, 13_000);
});

test("al gastar una reserva de meta, el gasto reemplaza la reserva sin tocar el presupuesto previo", () => {
  const result = calculateCommitments({
    ...base,
    budgets: [{ categoryId: "compra", assignedMinor: 10_000 }],
    expenseSpendByCategory: new Map([["compra", 3000]]),
    goalSpendByCategory: new Map([["compra", 3000]]),
    goals: [{ id: "g", status: "completed", reservedMinor: 0, categoryId: "compra", coveredByBudget: true }],
    goalContributions: [{ goalId: "g", amountMinor: 3000, occurredOn: "2026-11-12" }],
  });
  assert.equal(result.budgetRows[0].remainingMinor, 10_000);
  assert.equal(result.goalReservedMinor, 0);
  assert.equal(result.committedMinor, 10_000);
});

test("los adicionales se suman a la mayor base entre presupuesto y obligación", () => {
  const result = calculateCommitments({
    ...base,
    budgets: [
      { categoryId: "hogar", assignedMinor: 10_000, allocationType: "base" as const },
      { categoryId: "hogar", assignedMinor: 2000, allocationType: "additional" as const },
    ],
    obligations: [{ id: "o", kind: "expense", active: true, reservedMinor: 0, categoryId: "hogar", coveredByBudget: true, reserveMonth: "" }],
    obligationOccurrences: [{ id: "v", obligationId: "o", dueDate: "2026-11-25", expectedMinor: 12_000, paidMinor: 0, status: "pending" }],
  });
  assert.equal(result.budgetRows[0].effectiveAssignedMinor, 14_000);
  assert.equal(result.committedMinor, 14_000);
});

test("consumir reserva nunca produce valores negativos", () => {
  assert.deepEqual(consumeReservation(3000, 5000), { consumedMinor: 3000, remainingReservedMinor: 0 });
});

test("las transferencias calculan porcentajes y LBTR suma un cargo fijo", () => {
  const settings = {
    transferSameBankRateBps: 50,
    transferAchRateBps: 100,
    transferLbtrSurchargeMinor: 250,
    transferBankFees: { Banreservas: { achRateBps: 125, lbtrSurchargeMinor: 300 } },
  };
  // RD$1,000 = 100,000 centavos: 0.50% = RD$5.00.
  assert.equal(transferFeeFor("same_bank", "Banco A", "Banco A", 100_000, settings), 500);
  // El banco destino tiene una tarifa ACH específica de 1.25% = RD$12.50.
  assert.equal(transferFeeFor("ach", "Banco A", "Banreservas", 100_000, settings), 1250);
  // LBTR usa ese mismo 1.25% y suma RD$3.00.
  assert.equal(transferFeeFor("lbtr", "Banco A", "Banreservas", 100_000, settings), 1550);
});

test("una obligación de ingreso recurrente aparece automáticamente en el presupuesto del mes", () => {
  const rows = calculateIncomeBudgetRows(
    [{ id: "i", title: "Pago App", kind: "income", categoryId: "otros" }],
    [{ id: "o", obligationId: "i", dueDate: "2026-11-25", expectedMinor: 250_000, paidMinor: 50_000 }],
  );
  assert.deepEqual(rows[0], {
    id: "income-o", month: "2026-11", obligationId: "i", title: "Pago App", categoryId: "otros",
    expectedMinor: 250_000, receivedMinor: 50_000, remainingMinor: 200_000,
  });
});

test("la disponibilidad después de ingresos sólo suma lo pendiente", () => {
  const rows = [
    { month: "2026-11", remainingMinor: 200_000 },
    { month: "2026-11", remainingMinor: 50_000 },
    { month: "2026-12", remainingMinor: 900_000 },
    { month: "2026-11", remainingMinor: -10_000 },
  ];
  assert.equal(calculateRemainingIncomeForMonth(rows, "2026-11"), 250_000);
});
