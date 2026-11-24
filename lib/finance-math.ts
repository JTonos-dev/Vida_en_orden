export type BalanceTransaction = {
  type: string;
  accountId: string;
  destinationAccountId: string | null;
  amountMinor: number;
  feeMinor?: number;
  occurredOn: string;
  status: string;
};

export type TransferFeeSettings = {
  transferSameBankRateBps: number;
  transferAchRateBps: number;
  transferLbtrSurchargeMinor: number;
  transferBankFees: Record<string, { achRateBps: number; lbtrSurchargeMinor: number }>;
};

export function normalizeBankName(value: string | null | undefined) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase();
}

export function transferFeeFor(
  mode: string,
  sourceBank: string | null | undefined,
  destinationBank: string | null | undefined,
  amountMinor: number,
  settings: TransferFeeSettings,
) {
  const amount = Math.max(0, Math.round(amountMinor || 0));
  const percent = (rateBps: number) => Math.max(0, Math.round(amount * Math.max(0, rateBps || 0) / 10_000));
  if (mode === "same_bank") return percent(settings.transferSameBankRateBps);
  const profile = Object.entries(settings.transferBankFees || {}).find(([name]) => normalizeBankName(name) === normalizeBankName(destinationBank));
  const achRateBps = profile?.[1].achRateBps ?? settings.transferAchRateBps ?? 0;
  if (mode === "lbtr") return percent(achRateBps) + Math.max(0, profile?.[1].lbtrSurchargeMinor ?? settings.transferLbtrSurchargeMinor ?? 0);
  return percent(achRateBps);
}

export type IncomeBudgetObligation = { id: string; title: string; kind: string; categoryId: string | null };
export type IncomeBudgetOccurrence = { id: string; obligationId: string; dueDate: string; expectedMinor: number; paidMinor: number };
export type IncomeBudgetRow = {
  id: string; month: string; obligationId: string; title: string; categoryId: string | null;
  expectedMinor: number; receivedMinor: number; remainingMinor: number;
};

export function calculateIncomeBudgetRows(obligations: IncomeBudgetObligation[], occurrences: IncomeBudgetOccurrence[]): IncomeBudgetRow[] {
  const byId = new Map(obligations.map((obligation) => [obligation.id, obligation]));
  return occurrences.flatMap((occurrence) => {
    const obligation = byId.get(occurrence.obligationId);
    if (!obligation || obligation.kind !== "income") return [];
    const expectedMinor = Math.max(0, occurrence.expectedMinor);
    const receivedMinor = Math.min(expectedMinor, Math.max(0, occurrence.paidMinor));
    return [{
      id: `income-${occurrence.id}`,
      month: occurrence.dueDate.slice(0, 7),
      obligationId: occurrence.obligationId,
      title: obligation.title,
      categoryId: obligation.categoryId,
      expectedMinor,
      receivedMinor,
      remainingMinor: Math.max(0, expectedMinor - receivedMinor),
    }];
  });
}

/** Remaining income expected for a given month, excluding amounts already received. */
export function calculateRemainingIncomeForMonth(rows: Pick<IncomeBudgetRow, "month" | "remainingMinor">[], month: string) {
  return rows
    .filter((row) => row.month === month)
    .reduce((sum, row) => sum + Math.max(0, row.remainingMinor), 0);
}

export type BudgetCommitment = { categoryId: string; assignedMinor: number; allocationType?: "base" | "additional" };
export type ObligationCommitment = {
  id: string;
  kind: string;
  active: boolean;
  reservedMinor: number;
  categoryId: string | null;
  coveredByBudget: boolean;
  reserveMonth: string;
};
export type ObligationOccurrenceCommitment = {
  id: string;
  obligationId: string;
  dueDate: string;
  expectedMinor: number;
  paidMinor: number;
  status: string;
};
export type ObligationPayment = { occurrenceId: string; amountMinor: number; occurredOn: string; status: string };
export type GoalCommitment = {
  id: string;
  status: string;
  reservedMinor: number;
  categoryId: string | null;
  coveredByBudget: boolean;
};
export type GoalContribution = { goalId: string; amountMinor: number; occurredOn: string };

export function dateInTimeZone(value = new Date(), timeZone = "America/Santo_Domingo") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function nextRecurringDate(source: string, frequency: string) {
  const [year, month, day] = source.split("-").map(Number);
  if (!year || !month || !day) throw new Error("Fecha de recurrencia inválida");
  if (frequency === "weekly") {
    const date = new Date(Date.UTC(year, month - 1, day + 7, 12));
    return date.toISOString().slice(0, 10);
  }
  const targetYear = frequency === "yearly" ? year + 1 : year + Math.floor(month / 12);
  const targetMonthIndex = frequency === "yearly" ? month - 1 : month % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonthIndex + 1, 0, 12)).getUTCDate();
  return `${targetYear}-${String(targetMonthIndex + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

export function calculateAccountBalance(
  accountId: string,
  openingBalanceMinor: number,
  openingBalanceDate: string,
  asOfDate: string,
  transactions: BalanceTransaction[],
) {
  let balance = openingBalanceMinor;
  for (const transaction of transactions) {
    if (transaction.status !== "confirmed" || transaction.occurredOn < openingBalanceDate || transaction.occurredOn > asOfDate) continue;
    if (transaction.type === "income" && transaction.accountId === accountId) balance += transaction.amountMinor;
    if (transaction.type === "expense" && transaction.accountId === accountId) balance -= transaction.amountMinor + (transaction.feeMinor || 0);
    if (transaction.type === "adjustment" && transaction.accountId === accountId) balance += transaction.amountMinor;
    if (transaction.type === "transfer" && transaction.accountId === accountId) balance -= transaction.amountMinor + (transaction.feeMinor || 0);
    if (transaction.type === "transfer" && transaction.destinationAccountId === accountId) balance += transaction.amountMinor;
  }
  return balance;
}

export function consumeReservation(reservedMinor: number, paidMinor: number) {
  const consumedMinor = Math.min(Math.max(0, reservedMinor), Math.max(0, paidMinor));
  return { consumedMinor, remainingReservedMinor: Math.max(0, reservedMinor - consumedMinor) };
}

export function calculateCommitments(input: {
  month: string;
  liquidMinor: number;
  safetyMinor: number;
  budgets: BudgetCommitment[];
  expenseSpendByCategory: Map<string, number>;
  goalSpendByCategory?: Map<string, number>;
  obligations: ObligationCommitment[];
  obligationOccurrences: ObligationOccurrenceCommitment[];
  obligationPayments: ObligationPayment[];
  goals: GoalCommitment[];
  goalContributions: GoalContribution[];
}) {
  const obligationById = new Map(input.obligations.map((obligation) => [obligation.id, obligation]));
  const obligationsDueThisMonth = new Set<string>();
  const obligationProvision = new Map<string, number>();
  for (const occurrence of input.obligationOccurrences) {
    const obligation = obligationById.get(occurrence.obligationId);
    if (!obligation || !obligation.active || obligation.kind !== "expense" || !occurrence.dueDate.startsWith(input.month)) continue;
    obligationsDueThisMonth.add(obligation.id);
    const paidThisMonth = input.obligationPayments
      .filter((payment) => payment.status === "confirmed" && payment.occurrenceId === occurrence.id && payment.occurredOn.startsWith(input.month))
      .reduce((sum, payment) => sum + payment.amountMinor, 0);
    const remaining = Math.max(0, occurrence.expectedMinor - occurrence.paidMinor);
    const categoryId = obligation.categoryId || "";
    obligationProvision.set(categoryId, (obligationProvision.get(categoryId) || 0) + remaining + paidThisMonth);
  }

  const goalById = new Map(input.goals.map((goal) => [goal.id, goal]));
  const coveredGoalContributions = new Map<string, number>();
  for (const contribution of input.goalContributions) {
    const goal = goalById.get(contribution.goalId);
    if (!goal || !goal.coveredByBudget || !goal.categoryId || !contribution.occurredOn.startsWith(input.month)) continue;
    coveredGoalContributions.set(goal.categoryId, (coveredGoalContributions.get(goal.categoryId) || 0) + contribution.amountMinor);
  }

  const manualBase = new Map<string, number>();
  const manualAdditional = new Map<string, number>();
  for (const budget of input.budgets) {
    const target = budget.allocationType === "additional" ? manualAdditional : manualBase;
    target.set(budget.categoryId, (target.get(budget.categoryId) || 0) + budget.assignedMinor);
  }
  const categoryIds = new Set([...manualBase.keys(), ...manualAdditional.keys(), ...obligationProvision.keys(), ...coveredGoalContributions.keys(), ...input.expenseSpendByCategory.keys()]);
  const budgetRows = [...categoryIds].map((categoryId) => {
    const manualBaseMinor = manualBase.get(categoryId) || 0;
    const manualAdditionalMinor = manualAdditional.get(categoryId) || 0;
    const manualAssignedMinor = manualBaseMinor + manualAdditionalMinor;
    const obligationPlannedMinor = obligationProvision.get(categoryId) || 0;
    const goalAllocatedMinor = coveredGoalContributions.get(categoryId) || 0;
    // La base manual y las obligaciones se solapan; los adicionales y las metas amplían el sobre.
    const effectiveAssignedMinor = Math.max(manualBaseMinor, obligationPlannedMinor) + manualAdditionalMinor + goalAllocatedMinor;
    const spentMinor = input.expenseSpendByCategory.get(categoryId) || 0;
    const goalSpentMinor = Math.min(spentMinor, input.goalSpendByCategory?.get(categoryId) || 0);
    return {
      categoryId,
      manualAssignedMinor,
      manualBaseMinor,
      manualAdditionalMinor,
      obligationPlannedMinor,
      effectiveAssignedMinor,
      spentMinor,
      goalAllocatedMinor,
      // Unused goal allocations are already reserved; once spent, the real expense replaces that reservation.
      remainingMinor: Math.max(0, effectiveAssignedMinor - (spentMinor - goalSpentMinor) - goalAllocatedMinor),
    };
  });
  const budgetRemainingMinor = budgetRows.reduce((sum, row) => sum + row.remainingMinor, 0);

  const obligationReservedMinor = input.obligations
    .filter((item) => item.active && item.kind === "expense" && !obligationsDueThisMonth.has(item.id))
    .reduce((sum, item) => sum + item.reservedMinor, 0);
  const goalReservedMinor = input.goals
    .filter((item) => item.status === "active" || item.status === "funded")
    .reduce((sum, item) => sum + item.reservedMinor, 0);
  const committedMinor = budgetRemainingMinor + obligationReservedMinor + goalReservedMinor + input.safetyMinor;

  return {
    budgetRemainingMinor,
    obligationReservedMinor,
    goalReservedMinor,
    coveredByBudgetMinor: [...obligationProvision.values()].reduce((sum, value) => sum + value, 0)
      + [...coveredGoalContributions.values()].reduce((sum, value) => sum + value, 0),
    budgetRows,
    committedMinor,
    uncommittedMinor: input.liquidMinor - committedMinor,
  };
}
