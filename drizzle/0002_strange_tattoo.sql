CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`action` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`occurred_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`start_time` text DEFAULT '' NOT NULL,
	`end_time` text DEFAULT '' NOT NULL,
	`all_day` integer DEFAULT 1 NOT NULL,
	`timezone` text DEFAULT 'America/Santo_Domingo' NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`recurrence` text DEFAULT 'none' NOT NULL,
	`recurrence_until` text DEFAULT '' NOT NULL,
	`area_id` text,
	`project_id` text,
	`linked_task_id` text,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `finance_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`currency` text DEFAULT 'DOP' NOT NULL,
	`opening_balance_minor` integer DEFAULT 0 NOT NULL,
	`opening_balance_date` text NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `finance_budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`month` text NOT NULL,
	`category_id` text NOT NULL,
	`assigned_minor` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `finance_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`kind` text DEFAULT 'expense' NOT NULL,
	`color` text DEFAULT '#2463eb' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `finance_goal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`goal_id` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`occurred_on` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `finance_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`target_minor` integer NOT NULL,
	`reserved_minor` integer DEFAULT 0 NOT NULL,
	`target_date` text DEFAULT '' NOT NULL,
	`priority` text DEFAULT 'media' NOT NULL,
	`account_id` text,
	`linked_task_id` text,
	`linked_project_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `finance_obligation_occurrences` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`obligation_id` text NOT NULL,
	`due_date` text NOT NULL,
	`expected_minor` integer NOT NULL,
	`paid_minor` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`transaction_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `finance_obligations` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`expected_amount_minor` integer NOT NULL,
	`reserved_minor` integer DEFAULT 0 NOT NULL,
	`account_id` text,
	`category_id` text,
	`frequency` text DEFAULT 'monthly' NOT NULL,
	`next_due_date` text NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `finance_settings` (
	`owner_id` text PRIMARY KEY NOT NULL,
	`currency` text DEFAULT 'DOP' NOT NULL,
	`timezone` text DEFAULT 'America/Santo_Domingo' NOT NULL,
	`safety_buffer_minor` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `finance_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`type` text NOT NULL,
	`account_id` text NOT NULL,
	`destination_account_id` text,
	`amount_minor` integer NOT NULL,
	`occurred_on` text NOT NULL,
	`status` text DEFAULT 'confirmed' NOT NULL,
	`category_id` text,
	`task_id` text,
	`project_id` text,
	`description` text DEFAULT '' NOT NULL,
	`voided_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `home_areas` (
	`id` text PRIMARY KEY NOT NULL,
	`scope_id` text NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#2463eb' NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `home_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`scope_id` text NOT NULL,
	`area_id` text,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`start_date` text DEFAULT '' NOT NULL,
	`target_date` text DEFAULT '' NOT NULL,
	`budget_minor` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `home_tasks` ADD `area_id` text;--> statement-breakpoint
ALTER TABLE `home_tasks` ADD `project_id` text;--> statement-breakpoint
ALTER TABLE `home_tasks` ADD `scheduled_start_time` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `home_tasks` ADD `scheduled_end_time` text DEFAULT '' NOT NULL;