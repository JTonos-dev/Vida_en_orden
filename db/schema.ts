import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const homeWorkspaces = sqliteTable("home_workspaces", {
  userId: text("user_id").primaryKey(),
  budgetLimit: text("budget_limit"),
  sortMode: text("sort_mode").notNull().default("manual"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const homeTasks = sqliteTable("home_tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  parentId: text("parent_id"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  priority: text("priority").notNull().default("P"),
  effort: text("effort").notNull().default("media"),
  owner: text("owner").notNull().default(""),
  areaId: text("area_id"),
  projectId: text("project_id"),
  startDate: text("start_date").notNull().default(""),
  scheduledDate: text("scheduled_date").notNull().default(""),
  scheduledStartTime: text("scheduled_start_time").notNull().default(""),
  scheduledEndTime: text("scheduled_end_time").notNull().default(""),
  dueDate: text("due_date").notNull().default(""),
  createdAt: text("created_at"),
  updatedAt: text("updated_at").notNull(),
  completedAt: text("completed_at"),
  done: integer("done").notNull().default(0),
  archived: integer("archived").notNull().default(0),
  estimate: text("estimate"),
  actual: text("actual"),
  tags: text("tags").notNull().default("[]"),
  dependencies: text("dependencies").notNull().default("[]"),
  risk: text("risk").notNull().default(""),
  orderIndex: integer("order_index").notNull().default(0),
});

export const homeNotes = sqliteTable("home_notes", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  taskId: text("task_id").notNull(),
  text: text("text").notNull(),
  author: text("author").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const homeMovements = sqliteTable("home_movements", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  taskId: text("task_id").notNull(),
  amount: text("amount").notNull(),
  description: text("description").notNull().default(""),
  date: text("date").notNull(),
  createdAt: text("created_at").notNull(),
});

export const homeAreas = sqliteTable("home_areas", {
  id: text("id").primaryKey(),
  scopeId: text("scope_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#2463eb"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const homeProjects = sqliteTable("home_projects", {
  id: text("id").primaryKey(),
  scopeId: text("scope_id").notNull(),
  areaId: text("area_id"),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("active"),
  startDate: text("start_date").notNull().default(""),
  targetDate: text("target_date").notNull().default(""),
  budgetMinor: integer("budget_minor"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  location: text("location").notNull().default(""),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  startTime: text("start_time").notNull().default(""),
  endTime: text("end_time").notNull().default(""),
  allDay: integer("all_day").notNull().default(1),
  timezone: text("timezone").notNull().default("America/Santo_Domingo"),
  status: text("status").notNull().default("scheduled"),
  recurrence: text("recurrence").notNull().default("none"),
  recurrenceUntil: text("recurrence_until").notNull().default(""),
  areaId: text("area_id"),
  projectId: text("project_id"),
  linkedTaskId: text("linked_task_id"),
  notes: text("notes").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const financeAccounts = sqliteTable("finance_accounts", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), name: text("name").notNull(),
  type: text("type").notNull(), bankName: text("bank_name").notNull().default(""), currency: text("currency").notNull().default("DOP"),
  openingBalanceMinor: integer("opening_balance_minor").notNull().default(0),
  openingBalanceDate: text("opening_balance_date").notNull(), archived: integer("archived").notNull().default(0),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});

export const financeCategories = sqliteTable("finance_categories", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), name: text("name").notNull(),
  kind: text("kind").notNull().default("expense"), color: text("color").notNull().default("#2463eb"),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});

export const financeConcepts = sqliteTable("finance_concepts", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), concept: text("concept").notNull(),
  normalized: text("normalized").notNull(), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});

export const financeTransactions = sqliteTable("finance_transactions", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), type: text("type").notNull(),
  accountId: text("account_id").notNull(), destinationAccountId: text("destination_account_id"),
  amountMinor: integer("amount_minor").notNull(), occurredOn: text("occurred_on").notNull(),
  transferMode: text("transfer_mode"), feeMinor: integer("fee_minor").notNull().default(0),
  paymentMethod: text("payment_method").notNull().default("standard"), counterpartyBank: text("counterparty_bank").notNull().default(""),
  feeCategoryId: text("fee_category_id"), goalId: text("goal_id"),
  goalReservationConsumedMinor: integer("goal_reservation_consumed_minor").notNull().default(0),
  status: text("status").notNull().default("confirmed"), categoryId: text("category_id"),
  taskId: text("task_id"), projectId: text("project_id"), description: text("description").notNull().default(""),
  obligationOccurrenceId: text("obligation_occurrence_id"),
  reservationConsumedMinor: integer("reservation_consumed_minor").notNull().default(0),
  reservationMonth: text("reservation_month").notNull().default(""),
  voidedAt: text("voided_at"), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});

export const financeBudgets = sqliteTable("finance_budgets", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), month: text("month").notNull(),
  categoryId: text("category_id").notNull(), assignedMinor: integer("assigned_minor").notNull().default(0),
  concept: text("concept").notNull().default("Asignación base"), allocationType: text("allocation_type").notNull().default("base"),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});

export const financeObligations = sqliteTable("finance_obligations", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), title: text("title").notNull(), concept: text("concept").notNull().default(""),
  kind: text("kind").notNull(), expectedAmountMinor: integer("expected_amount_minor").notNull(),
  reservedMinor: integer("reserved_minor").notNull().default(0), accountId: text("account_id"),
  categoryId: text("category_id"), frequency: text("frequency").notNull().default("monthly"),
  coveredByBudget: integer("covered_by_budget").notNull().default(1),
  reserveMonth: text("reserve_month").notNull().default(""),
  nextDueDate: text("next_due_date").notNull(), active: integer("active").notNull().default(1),
  createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});

export const financeObligationOccurrences = sqliteTable("finance_obligation_occurrences", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), obligationId: text("obligation_id").notNull(),
  dueDate: text("due_date").notNull(), expectedMinor: integer("expected_minor").notNull(),
  paidMinor: integer("paid_minor").notNull().default(0), status: text("status").notNull().default("pending"),
  transactionId: text("transaction_id"), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});

export const financeGoals = sqliteTable("finance_goals", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), title: text("title").notNull(),
  targetMinor: integer("target_minor").notNull(), reservedMinor: integer("reserved_minor").notNull().default(0),
  usedMinor: integer("used_minor").notNull().default(0),
  targetDate: text("target_date").notNull().default(""), priority: text("priority").notNull().default("media"),
  accountId: text("account_id"), categoryId: text("category_id"), coveredByBudget: integer("covered_by_budget").notNull().default(1),
  linkedTaskId: text("linked_task_id"), linkedProjectId: text("linked_project_id"),
  status: text("status").notNull().default("active"), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull(),
});

export const financeGoalEntries = sqliteTable("finance_goal_entries", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), goalId: text("goal_id").notNull(),
  amountMinor: integer("amount_minor").notNull(), occurredOn: text("occurred_on").notNull(),
  concept: text("concept").notNull().default(""), note: text("note").notNull().default(""),
  voidedAt: text("voided_at"), createdAt: text("created_at").notNull(), updatedAt: text("updated_at").notNull().default(""),
});

export const financeSettings = sqliteTable("finance_settings", {
  ownerId: text("owner_id").primaryKey(), currency: text("currency").notNull().default("DOP"),
  timezone: text("timezone").notNull().default("America/Santo_Domingo"),
  safetyBufferMinor: integer("safety_buffer_minor").notNull().default(0),
  transferSameBankRateBps: integer("transfer_same_bank_rate_bps").notNull().default(0),
  transferAchRateBps: integer("transfer_ach_rate_bps").notNull().default(0),
  transferLbtrSurchargeMinor: integer("transfer_lbtr_surcharge_minor").notNull().default(0),
  transferSameBankFeeMinor: integer("transfer_same_bank_fee_minor").notNull().default(0),
  transferAchFeeMinor: integer("transfer_ach_fee_minor").notNull().default(0),
  transferLbtrFeeMinor: integer("transfer_lbtr_fee_minor").notNull().default(0),
  transferBankFeesJson: text("transfer_bank_fees_json").notNull().default("{}"),
  updatedAt: text("updated_at").notNull(),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(), ownerId: text("owner_id").notNull(), entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(), action: text("action").notNull(), metadata: text("metadata").notNull().default("{}"),
  occurredAt: text("occurred_at").notNull(),
});
