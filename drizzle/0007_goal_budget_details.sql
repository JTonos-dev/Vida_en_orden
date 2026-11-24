ALTER TABLE `finance_transactions` ADD `payment_method` text DEFAULT 'standard' NOT NULL;
--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD `counterparty_bank` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD `fee_category_id` text;
--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD `goal_id` text;
--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD `goal_reservation_consumed_minor` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `finance_budgets` ADD `concept` text DEFAULT 'Asignación base' NOT NULL;
--> statement-breakpoint
ALTER TABLE `finance_budgets` ADD `allocation_type` text DEFAULT 'base' NOT NULL;
--> statement-breakpoint
ALTER TABLE `finance_goals` ADD `used_minor` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `finance_goal_entries` ADD `concept` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `finance_goal_entries` ADD `voided_at` text;
--> statement-breakpoint
ALTER TABLE `finance_goal_entries` ADD `updated_at` text DEFAULT '' NOT NULL;
