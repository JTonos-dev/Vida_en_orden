// Fixed server-owned schema; never selected by model-supplied SQL.
export const BUSINESS_TABLES = [
  {
    "name": "audit_log",
    "columns": [
      "id",
      "owner_id",
      "entity_type",
      "entity_id",
      "action",
      "metadata",
      "occurred_at"
    ],
    "primaryKey": "id",
    "scopeColumn": "owner_id",
    "shared": false
  },
  {
    "name": "calendar_events",
    "columns": [
      "id",
      "owner_id",
      "title",
      "description",
      "location",
      "start_date",
      "end_date",
      "start_time",
      "end_time",
      "all_day",
      "timezone",
      "status",
      "recurrence",
      "recurrence_until",
      "area_id",
      "project_id",
      "linked_task_id",
      "notes",
      "created_at",
      "updated_at"
    ],
    "primaryKey": "id",
    "scopeColumn": "owner_id",
    "shared": false
  },
  {
    "name": "finance_accounts",
    "columns": [
      "id",
      "owner_id",
      "name",
      "type",
      "currency",
      "opening_balance_minor",
      "opening_balance_date",
      "archived",
      "created_at",
      "updated_at",
      "bank_name"
    ],
    "primaryKey": "id",
    "scopeColumn": "owner_id",
    "shared": false
  },
  {
    "name": "finance_budgets",
    "columns": [
      "id",
      "owner_id",
      "month",
      "category_id",
      "assigned_minor",
      "created_at",
      "updated_at",
      "concept",
      "allocation_type"
    ],
    "primaryKey": "id",
    "scopeColumn": "owner_id",
    "shared": false
  },
  {
    "name": "finance_categories",
    "columns": [
      "id",
      "owner_id",
      "name",
      "kind",
      "color",
      "created_at",
      "updated_at"
    ],
    "primaryKey": "id",
    "scopeColumn": "owner_id",
    "shared": false
  },
  {
    "name": "finance_concepts",
    "columns": [
      "id",
      "owner_id",
      "concept",
      "normalized",
      "created_at",
      "updated_at"
    ],
    "primaryKey": "id",
    "scopeColumn": "owner_id",
    "shared": false
  },
  {
    "name": "finance_goal_entries",
    "columns": [
      "id",
      "owner_id",
      "goal_id",
      "amount_minor",
      "occurred_on",
      "note",
      "created_at",
      "concept",
      "voided_at",
      "updated_at"
    ],
    "primaryKey": "id",
    "scopeColumn": "owner_id",
    "shared": false
  },
  {
    "name": "finance_goals",
    "columns": [
      "id",
      "owner_id",
      "title",
      "target_minor",
      "reserved_minor",
      "target_date",
      "priority",
      "account_id",
      "linked_task_id",
      "linked_project_id",
      "status",
      "created_at",
      "updated_at",
      "category_id",
      "covered_by_budget",
      "used_minor"
    ],
    "primaryKey": "id",
    "scopeColumn": "owner_id",
    "shared": false
  },
  {
    "name": "finance_obligation_occurrences",
    "columns": [
      "id",
      "owner_id",
      "obligation_id",
      "due_date",
      "expected_minor",
      "paid_minor",
      "status",
      "transaction_id",
      "created_at",
      "updated_at"
    ],
    "primaryKey": "id",
    "scopeColumn": "owner_id",
    "shared": false
  },
  {
    "name": "finance_obligations",
    "columns": [
      "id",
      "owner_id",
      "title",
      "kind",
      "expected_amount_minor",
      "reserved_minor",
      "account_id",
      "category_id",
      "frequency",
      "next_due_date",
      "active",
      "created_at",
      "updated_at",
      "covered_by_budget",
      "reserve_month",
      "concept"
    ],
    "primaryKey": "id",
    "scopeColumn": "owner_id",
    "shared": false
  },
  {
    "name": "finance_settings",
    "columns": [
      "owner_id",
      "currency",
      "timezone",
      "safety_buffer_minor",
      "updated_at",
      "transfer_same_bank_fee_minor",
      "transfer_ach_fee_minor",
      "transfer_lbtr_fee_minor",
      "transfer_bank_fees_json",
      "transfer_same_bank_rate_bps",
      "transfer_ach_rate_bps",
      "transfer_lbtr_surcharge_minor"
    ],
    "primaryKey": "owner_id",
    "scopeColumn": "owner_id",
    "shared": false
  },
  {
    "name": "finance_transactions",
    "columns": [
      "id",
      "owner_id",
      "type",
      "account_id",
      "destination_account_id",
      "amount_minor",
      "occurred_on",
      "status",
      "category_id",
      "task_id",
      "project_id",
      "description",
      "voided_at",
      "created_at",
      "updated_at",
      "obligation_occurrence_id",
      "reservation_consumed_minor",
      "reservation_month",
      "transfer_mode",
      "fee_minor",
      "payment_method",
      "counterparty_bank",
      "fee_category_id",
      "goal_id",
      "goal_reservation_consumed_minor"
    ],
    "primaryKey": "id",
    "scopeColumn": "owner_id",
    "shared": false
  },
  {
    "name": "home_areas",
    "columns": [
      "id",
      "scope_id",
      "name",
      "color",
      "order_index",
      "created_at",
      "updated_at"
    ],
    "primaryKey": "id",
    "scopeColumn": "scope_id",
    "shared": true
  },
  {
    "name": "home_movements",
    "columns": [
      "id",
      "user_id",
      "task_id",
      "amount",
      "description",
      "date",
      "created_at"
    ],
    "primaryKey": "id",
    "scopeColumn": "user_id",
    "shared": true
  },
  {
    "name": "home_notes",
    "columns": [
      "id",
      "user_id",
      "task_id",
      "text",
      "author",
      "created_at",
      "updated_at"
    ],
    "primaryKey": "id",
    "scopeColumn": "user_id",
    "shared": true
  },
  {
    "name": "home_projects",
    "columns": [
      "id",
      "scope_id",
      "area_id",
      "name",
      "description",
      "status",
      "start_date",
      "target_date",
      "budget_minor",
      "created_at",
      "updated_at"
    ],
    "primaryKey": "id",
    "scopeColumn": "scope_id",
    "shared": true
  },
  {
    "name": "home_tasks",
    "columns": [
      "id",
      "user_id",
      "parent_id",
      "title",
      "description",
      "priority",
      "effort",
      "owner",
      "due_date",
      "created_at",
      "updated_at",
      "completed_at",
      "done",
      "archived",
      "estimate",
      "actual",
      "tags",
      "dependencies",
      "risk",
      "order_index",
      "start_date",
      "scheduled_date",
      "area_id",
      "project_id",
      "scheduled_start_time",
      "scheduled_end_time"
    ],
    "primaryKey": "id",
    "scopeColumn": "user_id",
    "shared": true
  },
  {
    "name": "home_workspaces",
    "columns": [
      "user_id",
      "budget_limit",
      "sort_mode",
      "created_at",
      "updated_at"
    ],
    "primaryKey": "user_id",
    "scopeColumn": "user_id",
    "shared": true
  }
] as const;
export type BusinessTable = (typeof BUSINESS_TABLES)[number];
export type BusinessTableName = BusinessTable["name"];
