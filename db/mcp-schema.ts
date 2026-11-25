// Additive MCP infrastructure. Keep aligned with migrations 0008–0010 and tables.ts.
import { sqliteTable, text, integer, primaryKey, index, uniqueIndex, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const mcp_approval_challenges = sqliteTable("mcp_approval_challenges", {
  challenge: text("challenge").notNull().primaryKey(),
  proposal_id: text("proposal_id").notNull(),
  revision: integer("revision").notNull(),
  owner_id: text("owner_id").notNull(),
  digest: text("digest").notNull(),
  expires_at: integer("expires_at").notNull(),
  used: integer("used").notNull().default(sql.raw("0"))
}, () => [check("mcp_challenge_used",sql.raw("used IN (0,1)"))]);

export const mcp_approvals = sqliteTable("mcp_approvals", {
  proposal_id: text("proposal_id").notNull(),
  revision: integer("revision").notNull(),
  owner_id: text("owner_id").notNull(),
  digest: text("digest").notNull(),
  challenge: text("challenge").notNull(),
  credential_id: text("credential_id").notNull(),
  expires_at: integer("expires_at").notNull(),
  approved_at: integer("approved_at").notNull()
}, (table) => [primaryKey({ columns: [table.proposal_id,table.revision] })]);

export const mcp_execution_guards = sqliteTable("mcp_execution_guards", {
  execution_id: text("execution_id").notNull().primaryKey(),
  valid: integer("valid").notNull()
}, () => [check("mcp_guard_valid",sql.raw("valid=1"))]);

export const mcp_executions = sqliteTable("mcp_executions", {
  execution_id: text("execution_id").notNull().primaryKey(),
  proposal_id: text("proposal_id").notNull(),
  revision: integer("revision").notNull(),
  owner_id: text("owner_id").notNull(),
  idempotency_hash: text("idempotency_hash").notNull(),
  result: text("result").notNull(),
  created_at: integer("created_at").notNull()
}, (table) => [uniqueIndex("mcp_executions_owner_id_idempotency_hash_unique").on(table.owner_id,table.idempotency_hash),uniqueIndex("mcp_executions_proposal_id_revision_unique").on(table.proposal_id,table.revision)]);

export const mcp_installation = sqliteTable("mcp_installation", {
  id: integer("id").notNull().primaryKey(),
  installation_id: text("installation_id").notNull(),
  business_revision: integer("business_revision").notNull().default(sql.raw("0"))
}, () => [check("mcp_installation_singleton",sql.raw("id=1"))]);

export const mcp_plan_audit = sqliteTable("mcp_plan_audit", {
  id: text("id").notNull().primaryKey(),
  owner_id: text("owner_id").notNull(),
  proposal_id: text("proposal_id").notNull(),
  revision: integer("revision").notNull(),
  event: text("event").notNull(),
  metrics: text("metrics").notNull().default(sql.raw("'{}'")),
  created_at: integer("created_at").notNull()
}, (table) => [index("mcp_plan_audit_owner_date").on(table.owner_id,table.created_at)]);

export const mcp_proposal_heads = sqliteTable("mcp_proposal_heads", {
  proposal_id: text("proposal_id").notNull().primaryKey(),
  owner_id: text("owner_id").notNull(),
  revision: integer("revision").notNull()
});

export const mcp_proposals = sqliteTable("mcp_proposals", {
  proposal_id: text("proposal_id").notNull(),
  revision: integer("revision").notNull(),
  owner_id: text("owner_id").notNull(),
  state: text("state").notNull(),
  digest: text("digest").notNull(),
  payload: text("payload").notNull(),
  base_revision: integer("base_revision").notNull(),
  expires_at: integer("expires_at").notNull(),
  created_at: integer("created_at").notNull()
}, (table) => [primaryKey({ columns: [table.proposal_id,table.revision] }),index("mcp_proposals_owner_state").on(table.owner_id,table.state,table.expires_at),check("mcp_proposals_state",sql.raw("state IN ('VALIDATED','PENDING_APPROVAL','APPROVED','COMMITTED','CANCELLED','EXPIRED','INVALIDATED')"))]);

export const mcp_stage_audit_log = sqliteTable("mcp_stage_audit_log", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  owner_id: text("owner_id").notNull(),
  entity_type: text("entity_type").notNull(),
  entity_id: text("entity_id").notNull(),
  action: text("action").notNull(),
  metadata: text("metadata").notNull().default(sql.raw("'{}'")),
  occurred_at: text("occurred_at").notNull()
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_audit_log_partition").on(table.proposal_id)]);

export const mcp_stage_calendar_events = sqliteTable("mcp_stage_calendar_events", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  owner_id: text("owner_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull().default(sql.raw("''")),
  location: text("location").notNull().default(sql.raw("''")),
  start_date: text("start_date").notNull(),
  end_date: text("end_date").notNull(),
  start_time: text("start_time").notNull().default(sql.raw("''")),
  end_time: text("end_time").notNull().default(sql.raw("''")),
  all_day: integer("all_day").notNull().default(sql.raw("1")),
  timezone: text("timezone").notNull().default(sql.raw("'America/Santo_Domingo'")),
  status: text("status").notNull().default(sql.raw("'scheduled'")),
  recurrence: text("recurrence").notNull().default(sql.raw("'none'")),
  recurrence_until: text("recurrence_until").notNull().default(sql.raw("''")),
  area_id: text("area_id"),
  project_id: text("project_id"),
  linked_task_id: text("linked_task_id"),
  notes: text("notes").notNull().default(sql.raw("''")),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull()
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_calendar_events_partition").on(table.proposal_id)]);

export const mcp_stage_finance_accounts = sqliteTable("mcp_stage_finance_accounts", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  owner_id: text("owner_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  currency: text("currency").notNull().default(sql.raw("'DOP'")),
  opening_balance_minor: integer("opening_balance_minor").notNull().default(sql.raw("0")),
  opening_balance_date: text("opening_balance_date").notNull(),
  archived: integer("archived").notNull().default(sql.raw("0")),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  bank_name: text("bank_name").notNull().default(sql.raw("''"))
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_finance_accounts_partition").on(table.proposal_id)]);

export const mcp_stage_finance_budgets = sqliteTable("mcp_stage_finance_budgets", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  owner_id: text("owner_id").notNull(),
  month: text("month").notNull(),
  category_id: text("category_id").notNull(),
  assigned_minor: integer("assigned_minor").notNull().default(sql.raw("0")),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  concept: text("concept").notNull().default(sql.raw("'Asignación base'")),
  allocation_type: text("allocation_type").notNull().default(sql.raw("'base'"))
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_finance_budgets_partition").on(table.proposal_id)]);

export const mcp_stage_finance_categories = sqliteTable("mcp_stage_finance_categories", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  owner_id: text("owner_id").notNull(),
  name: text("name").notNull(),
  kind: text("kind").notNull().default(sql.raw("'expense'")),
  color: text("color").notNull().default(sql.raw("'#2463eb'")),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull()
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_finance_categories_partition").on(table.proposal_id)]);

export const mcp_stage_finance_concepts = sqliteTable("mcp_stage_finance_concepts", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  owner_id: text("owner_id").notNull(),
  concept: text("concept").notNull(),
  normalized: text("normalized").notNull(),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull()
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),uniqueIndex("mcp_stage_concepts_unique").on(table.proposal_id,table.owner_id,table.normalized),index("mcp_stage_finance_concepts_partition").on(table.proposal_id)]);

export const mcp_stage_finance_goal_entries = sqliteTable("mcp_stage_finance_goal_entries", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  owner_id: text("owner_id").notNull(),
  goal_id: text("goal_id").notNull(),
  amount_minor: integer("amount_minor").notNull(),
  occurred_on: text("occurred_on").notNull(),
  note: text("note").notNull().default(sql.raw("''")),
  created_at: text("created_at").notNull(),
  concept: text("concept").notNull().default(sql.raw("''")),
  voided_at: text("voided_at"),
  updated_at: text("updated_at").notNull().default(sql.raw("''"))
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_finance_goal_entries_partition").on(table.proposal_id)]);

export const mcp_stage_finance_goals = sqliteTable("mcp_stage_finance_goals", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  owner_id: text("owner_id").notNull(),
  title: text("title").notNull(),
  target_minor: integer("target_minor").notNull(),
  reserved_minor: integer("reserved_minor").notNull().default(sql.raw("0")),
  target_date: text("target_date").notNull().default(sql.raw("''")),
  priority: text("priority").notNull().default(sql.raw("'media'")),
  account_id: text("account_id"),
  linked_task_id: text("linked_task_id"),
  linked_project_id: text("linked_project_id"),
  status: text("status").notNull().default(sql.raw("'active'")),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  category_id: text("category_id"),
  covered_by_budget: integer("covered_by_budget").notNull().default(sql.raw("1")),
  used_minor: integer("used_minor").notNull().default(sql.raw("0"))
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_finance_goals_partition").on(table.proposal_id)]);

export const mcp_stage_finance_obligation_occurrences = sqliteTable("mcp_stage_finance_obligation_occurrences", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  owner_id: text("owner_id").notNull(),
  obligation_id: text("obligation_id").notNull(),
  due_date: text("due_date").notNull(),
  expected_minor: integer("expected_minor").notNull(),
  paid_minor: integer("paid_minor").notNull().default(sql.raw("0")),
  status: text("status").notNull().default(sql.raw("'pending'")),
  transaction_id: text("transaction_id"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull()
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_finance_obligation_occurrences_partition").on(table.proposal_id)]);

export const mcp_stage_finance_obligations = sqliteTable("mcp_stage_finance_obligations", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  owner_id: text("owner_id").notNull(),
  title: text("title").notNull(),
  kind: text("kind").notNull(),
  expected_amount_minor: integer("expected_amount_minor").notNull(),
  reserved_minor: integer("reserved_minor").notNull().default(sql.raw("0")),
  account_id: text("account_id"),
  category_id: text("category_id"),
  frequency: text("frequency").notNull().default(sql.raw("'monthly'")),
  next_due_date: text("next_due_date").notNull(),
  active: integer("active").notNull().default(sql.raw("1")),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  covered_by_budget: integer("covered_by_budget").notNull().default(sql.raw("1")),
  reserve_month: text("reserve_month").notNull().default(sql.raw("''")),
  concept: text("concept").notNull().default(sql.raw("''"))
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_finance_obligations_partition").on(table.proposal_id)]);

export const mcp_stage_finance_settings = sqliteTable("mcp_stage_finance_settings", {
  proposal_id: text("proposal_id").notNull(),
  owner_id: text("owner_id").notNull(),
  currency: text("currency").notNull().default(sql.raw("'DOP'")),
  timezone: text("timezone").notNull().default(sql.raw("'America/Santo_Domingo'")),
  safety_buffer_minor: integer("safety_buffer_minor").notNull().default(sql.raw("0")),
  updated_at: text("updated_at").notNull(),
  transfer_same_bank_fee_minor: integer("transfer_same_bank_fee_minor").notNull().default(sql.raw("0")),
  transfer_ach_fee_minor: integer("transfer_ach_fee_minor").notNull().default(sql.raw("0")),
  transfer_lbtr_fee_minor: integer("transfer_lbtr_fee_minor").notNull().default(sql.raw("0")),
  transfer_bank_fees_json: text("transfer_bank_fees_json").notNull().default(sql.raw("'{}'")),
  transfer_same_bank_rate_bps: integer("transfer_same_bank_rate_bps").notNull().default(sql.raw("0")),
  transfer_ach_rate_bps: integer("transfer_ach_rate_bps").notNull().default(sql.raw("0")),
  transfer_lbtr_surcharge_minor: integer("transfer_lbtr_surcharge_minor").notNull().default(sql.raw("0"))
}, (table) => [primaryKey({ columns: [table.proposal_id,table.owner_id] }),index("mcp_stage_finance_settings_partition").on(table.proposal_id)]);

export const mcp_stage_finance_transactions = sqliteTable("mcp_stage_finance_transactions", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  owner_id: text("owner_id").notNull(),
  type: text("type").notNull(),
  account_id: text("account_id").notNull(),
  destination_account_id: text("destination_account_id"),
  amount_minor: integer("amount_minor").notNull(),
  occurred_on: text("occurred_on").notNull(),
  status: text("status").notNull().default(sql.raw("'confirmed'")),
  category_id: text("category_id"),
  task_id: text("task_id"),
  project_id: text("project_id"),
  description: text("description").notNull().default(sql.raw("''")),
  voided_at: text("voided_at"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull(),
  obligation_occurrence_id: text("obligation_occurrence_id"),
  reservation_consumed_minor: integer("reservation_consumed_minor").notNull().default(sql.raw("0")),
  reservation_month: text("reservation_month").notNull().default(sql.raw("''")),
  transfer_mode: text("transfer_mode"),
  fee_minor: integer("fee_minor").notNull().default(sql.raw("0")),
  payment_method: text("payment_method").notNull().default(sql.raw("'standard'")),
  counterparty_bank: text("counterparty_bank").notNull().default(sql.raw("''")),
  fee_category_id: text("fee_category_id"),
  goal_id: text("goal_id"),
  goal_reservation_consumed_minor: integer("goal_reservation_consumed_minor").notNull().default(sql.raw("0"))
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_finance_transactions_partition").on(table.proposal_id)]);

export const mcp_stage_home_areas = sqliteTable("mcp_stage_home_areas", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  scope_id: text("scope_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default(sql.raw("'#2463eb'")),
  order_index: integer("order_index").notNull().default(sql.raw("0")),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull()
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_home_areas_partition").on(table.proposal_id)]);

export const mcp_stage_home_movements = sqliteTable("mcp_stage_home_movements", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  user_id: text("user_id").notNull(),
  task_id: text("task_id").notNull(),
  amount: text("amount").notNull(),
  description: text("description").notNull().default(sql.raw("''")),
  date: text("date").notNull(),
  created_at: text("created_at").notNull()
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_home_movements_partition").on(table.proposal_id)]);

export const mcp_stage_home_notes = sqliteTable("mcp_stage_home_notes", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  user_id: text("user_id").notNull(),
  task_id: text("task_id").notNull(),
  text: text("text").notNull(),
  author: text("author").notNull().default(sql.raw("''")),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull()
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_home_notes_partition").on(table.proposal_id)]);

export const mcp_stage_home_projects = sqliteTable("mcp_stage_home_projects", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  scope_id: text("scope_id").notNull(),
  area_id: text("area_id"),
  name: text("name").notNull(),
  description: text("description").notNull().default(sql.raw("''")),
  status: text("status").notNull().default(sql.raw("'active'")),
  start_date: text("start_date").notNull().default(sql.raw("''")),
  target_date: text("target_date").notNull().default(sql.raw("''")),
  budget_minor: integer("budget_minor"),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull()
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_home_projects_partition").on(table.proposal_id)]);

export const mcp_stage_home_tasks = sqliteTable("mcp_stage_home_tasks", {
  proposal_id: text("proposal_id").notNull(),
  id: text("id").notNull(),
  user_id: text("user_id").notNull(),
  parent_id: text("parent_id"),
  title: text("title").notNull(),
  description: text("description").notNull().default(sql.raw("''")),
  priority: text("priority").notNull().default(sql.raw("'P'")),
  effort: text("effort").notNull().default(sql.raw("'media'")),
  owner: text("owner").notNull().default(sql.raw("''")),
  due_date: text("due_date").notNull().default(sql.raw("''")),
  created_at: text("created_at"),
  updated_at: text("updated_at").notNull(),
  completed_at: text("completed_at"),
  done: integer("done").notNull().default(sql.raw("0")),
  archived: integer("archived").notNull().default(sql.raw("0")),
  estimate: text("estimate"),
  actual: text("actual"),
  tags: text("tags").notNull().default(sql.raw("'[]'")),
  dependencies: text("dependencies").notNull().default(sql.raw("'[]'")),
  risk: text("risk").notNull().default(sql.raw("''")),
  order_index: integer("order_index").notNull().default(sql.raw("0")),
  start_date: text("start_date").notNull().default(sql.raw("''")),
  scheduled_date: text("scheduled_date").notNull().default(sql.raw("''")),
  area_id: text("area_id"),
  project_id: text("project_id"),
  scheduled_start_time: text("scheduled_start_time").notNull().default(sql.raw("''")),
  scheduled_end_time: text("scheduled_end_time").notNull().default(sql.raw("''"))
}, (table) => [primaryKey({ columns: [table.proposal_id,table.id] }),index("mcp_stage_home_tasks_partition").on(table.proposal_id)]);

export const mcp_stage_home_workspaces = sqliteTable("mcp_stage_home_workspaces", {
  proposal_id: text("proposal_id").notNull(),
  user_id: text("user_id").notNull(),
  budget_limit: text("budget_limit"),
  sort_mode: text("sort_mode").notNull().default(sql.raw("'manual'")),
  created_at: text("created_at").notNull(),
  updated_at: text("updated_at").notNull()
}, (table) => [primaryKey({ columns: [table.proposal_id,table.user_id] }),index("mcp_stage_home_workspaces_partition").on(table.proposal_id)]);
export const mcp_registration_challenges = sqliteTable("mcp_registration_challenges", {
  challenge: text("challenge").notNull().primaryKey(),
  owner_id: text("owner_id").notNull(),
  expires_at: integer("expires_at").notNull(),
  used: integer("used").notNull().default(sql.raw("0"))
}, (table) => [check("mcp_registration_used",sql.raw("used IN (0,1)")),index("mcp_registration_owner_expiry").on(table.owner_id,table.expires_at)]);
export const mcp_prepare_requests = sqliteTable("mcp_prepare_requests", {
 owner_id:text("owner_id").notNull(),key_hash:text("key_hash").notNull(),input_hash:text("input_hash").notNull(),proposal_id:text("proposal_id").notNull()
},table=>[primaryKey({columns:[table.owner_id,table.key_hash]})]);
export const mcp_stage_leases=sqliteTable("mcp_stage_leases",{
 stage_id:text("stage_id").notNull().primaryKey(),owner_id:text("owner_id").notNull(),expires_at:integer("expires_at").notNull()
},table=>[index("mcp_stage_owner_expiry").on(table.owner_id,table.expires_at)]);
export const mcp_approval_evidence=sqliteTable("mcp_approval_evidence",{
 proposal_id:text("proposal_id").notNull(),revision:integer("revision").notNull(),owner_id:text("owner_id").notNull(),digest:text("digest").notNull(),challenge:text("challenge").notNull(),credential_id:text("credential_id").notNull(),evidence:text("evidence").notNull(),created_at:integer("created_at").notNull()
},table=>[primaryKey({columns:[table.proposal_id,table.revision]})]);
