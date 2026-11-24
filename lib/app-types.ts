export type Task = {
  id: string;
  parentId: string | null;
  title: string;
  description: string;
  priority: string;
  effort: string;
  owner: string;
  areaId: string | null;
  projectId: string | null;
  startDate: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  dueDate: string;
  createdAt: string | null;
  updatedAt: string;
  completedAt: string | null;
  done: boolean;
  archived: boolean;
  estimate: number | null;
  actual: number | null;
  tags: string[];
  risk: string;
  order: number;
};

export type Note = { id: string; taskId: string; text: string; author: string; createdAt: string };
export type LegacyMovement = { id: string; taskId: string; amount: number; description: string; date: string };
export type Area = { id: string; name: string; color: string; order: number };
export type Project = {
  id: string; areaId: string | null; name: string; description: string; status: string;
  startDate: string; targetDate: string; budgetMinor: number | null; spentMinor: number;
};
export type CalendarEvent = {
  id: string; title: string; description: string; location: string; startDate: string; endDate: string;
  startTime: string; endTime: string; allDay: boolean; timezone: string; status: string; recurrence: string;
  recurrenceUntil: string; areaId: string | null; projectId: string | null; linkedTaskId: string | null; notes: string;
};
export type FinanceAccount = {
  id: string; name: string; type: string; bankName: string; currency: string; openingBalanceMinor: number;
  openingBalanceDate: string; archived: boolean; balanceMinor: number; createdAt: string;
};
export type FinanceCategory = { id: string; name: string; kind: string; color: string };
export type FinanceConcept = { id: string; concept: string };
export type FinanceTransaction = {
  id: string; type: string; accountId: string; destinationAccountId: string | null; amountMinor: number;
  transferMode: string | null; feeMinor: number; paymentMethod: string; counterpartyBank: string; feeCategoryId: string | null;
  occurredOn: string; status: string; categoryId: string | null; taskId: string | null; projectId: string | null;
  description: string; voidedAt: string | null; createdAt: string;
  obligationOccurrenceId: string | null; reservationConsumedMinor: number; reservationMonth: string;
  goalId: string | null; goalReservationConsumedMinor: number;
};
export type FinanceBudget = {
  id: string; month: string; categoryId: string; manualAssignedMinor: number; manualBaseMinor: number; manualAdditionalMinor: number; obligationPlannedMinor: number;
  effectiveAssignedMinor: number; spentMinor: number; goalAllocatedMinor: number; remainingMinor: number;
};
export type FinanceBudgetAllocation = {
  id: string; month: string; categoryId: string; assignedMinor: number; concept: string; allocationType: "base" | "additional";
};
export type FinanceIncomeBudget = {
  id: string; month: string; obligationId: string; title: string; categoryId: string | null;
  expectedMinor: number; receivedMinor: number; remainingMinor: number;
};
export type FinanceObligation = {
  id: string; title: string; concept: string; kind: string; expectedAmountMinor: number; reservedMinor: number;
  accountId: string | null; categoryId: string | null; frequency: string; coveredByBudget: boolean; reserveMonth: string; nextDueDate: string; active: boolean;
};
export type FinanceOccurrence = {
  id: string; obligationId: string; dueDate: string; expectedMinor: number; paidMinor: number;
  status: string; transactionId: string | null;
};
export type FinanceGoal = {
  id: string; title: string; targetMinor: number; reservedMinor: number; usedMinor: number; targetDate: string; priority: string;
  accountId: string | null; categoryId: string | null; coveredByBudget: boolean; linkedTaskId: string | null; linkedProjectId: string | null; status: string;
};
export type FinanceGoalEntry = { id: string; goalId: string; amountMinor: number; occurredOn: string; concept: string; note: string; voidedAt: string | null };
export type AuditItem = { id: string; entityType: string; entityId: string; action: string; metadata: string; occurredAt: string };
export type CashflowPoint = { date: string; changeMinor: number; balanceMinor: number };
export type FinanceState = {
  accounts: FinanceAccount[];
  categories: FinanceCategory[];
  concepts: FinanceConcept[];
  transactions: FinanceTransaction[];
  budgets: FinanceBudget[];
  budgetAllocations: FinanceBudgetAllocation[];
  obligations: FinanceObligation[];
  occurrences: FinanceOccurrence[];
  incomeBudgets: FinanceIncomeBudget[];
  goals: FinanceGoal[];
  goalEntries: FinanceGoalEntry[];
  settings: {
    currency: string; timezone: string; safetyBufferMinor: number;
    transferSameBankRateBps: number; transferAchRateBps: number; transferLbtrSurchargeMinor: number;
    transferBankFees: Record<string, { achRateBps: number; lbtrSurchargeMinor: number }>;
  };
  summary: {
    liquidMinor: number; budgetRemainingMinor: number; obligationReservedMinor: number;
    goalReservedMinor: number; coveredByBudgetMinor: number; committedMinor: number; safetyBufferMinor: number; uncommittedMinor: number;
  };
  taskSpend: Record<string, number>;
  projectSpend: Record<string, number>;
  cashflow: CashflowPoint[];
  audits: AuditItem[];
};
export type AppData = {
  budgetLimit: number | null;
  sort: string;
  tasks: Task[];
  notes: Note[];
  movements: LegacyMovement[];
  areas: Area[];
  projects: Project[];
  events: CalendarEvent[];
  finance: FinanceState;
};

export const emptyFinance: FinanceState = {
  accounts: [], categories: [], concepts: [], transactions: [], budgets: [], budgetAllocations: [], obligations: [], occurrences: [], incomeBudgets: [], goals: [], goalEntries: [],
  settings: { currency: "DOP", timezone: "America/Santo_Domingo", safetyBufferMinor: 0, transferSameBankRateBps: 0, transferAchRateBps: 0, transferLbtrSurchargeMinor: 0, transferBankFees: {} },
  summary: { liquidMinor: 0, budgetRemainingMinor: 0, obligationReservedMinor: 0, goalReservedMinor: 0, coveredByBudgetMinor: 0, committedMinor: 0, safetyBufferMinor: 0, uncommittedMinor: 0 },
  taskSpend: {}, projectSpend: {}, cashflow: [], audits: [],
};

export const emptyData: AppData = {
  budgetLimit: null, sort: "manual", tasks: [], notes: [], movements: [], areas: [], projects: [], events: [], finance: emptyFinance,
};

export type ActionFn = (action: string, payload?: Record<string, unknown>) => Promise<void>;
