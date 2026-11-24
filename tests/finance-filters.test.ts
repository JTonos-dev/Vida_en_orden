import assert from "node:assert/strict";
import test from "node:test";
import type { FinanceTransaction } from "../lib/app-types.ts";
import { matchesMovementFilters } from "../lib/finance-filters.ts";

const base = (overrides: Partial<FinanceTransaction> = {}): FinanceTransaction => ({
  id: "tx-1", type: "expense", accountId: "checking", destinationAccountId: null, amountMinor: 12500,
  transferMode: null, feeMinor: 0, paymentMethod: "standard", counterpartyBank: "", feeCategoryId: null,
  occurredOn: "2026-11-15", status: "confirmed", categoryId: "food", taskId: null, projectId: null,
  description: "Supermercado", voidedAt: null, createdAt: "2026-11-15T12:00:00.000Z",
  obligationOccurrenceId: null, reservationConsumedMinor: 0, reservationMonth: "", goalId: null,
  goalReservationConsumedMinor: 0, ...overrides,
});

const empty = { query: "", dateFrom: "", dateTo: "", accountId: "", direction: "all" as const };

test("busca texto en campos crudos y nombres relacionados", () => {
  assert.equal(matchesMovementFilters(base(), { ...empty, query: "12500" }), true);
  assert.equal(matchesMovementFilters(base(), { ...empty, query: "supermercado" }, { categoryName: "Alimentos" }), true);
  assert.equal(matchesMovementFilters(base(), { ...empty, query: "alimentos" }, { categoryName: "Alimentos" }), true);
  assert.equal(matchesMovementFilters(base(), { ...empty, query: "transporte" }, { categoryName: "Alimentos" }), false);
});

test("acepta fecha única y rango inclusivo", () => {
  assert.equal(matchesMovementFilters(base(), { ...empty, dateFrom: "2026-11-15" }), true);
  assert.equal(matchesMovementFilters(base(), { ...empty, dateFrom: "2026-11-14" }), false);
  assert.equal(matchesMovementFilters(base(), { ...empty, dateFrom: "2026-11-01", dateTo: "2026-11-15" }), true);
  assert.equal(matchesMovementFilters(base(), { ...empty, dateFrom: "2026-11-16", dateTo: "2026-11-20" }), false);
});

test("considera cuenta de origen y destino, con dirección contextual", () => {
  const transfer = base({ type: "transfer", accountId: "checking", destinationAccountId: "savings" });
  assert.equal(matchesMovementFilters(transfer, { ...empty, accountId: "savings", direction: "credit" }), true);
  assert.equal(matchesMovementFilters(transfer, { ...empty, accountId: "savings", direction: "debit" }), false);
  assert.equal(matchesMovementFilters(transfer, { ...empty, accountId: "checking", direction: "debit" }), true);
  assert.equal(matchesMovementFilters(base({ type: "income" }), { ...empty, direction: "credit" }), true);
  assert.equal(matchesMovementFilters(base(), { ...empty, direction: "credit" }), false);
});
