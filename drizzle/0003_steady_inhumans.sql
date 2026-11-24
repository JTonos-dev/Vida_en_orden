ALTER TABLE `finance_goals` ADD `category_id` text;--> statement-breakpoint
ALTER TABLE `finance_goals` ADD `covered_by_budget` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_obligations` ADD `covered_by_budget` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_obligations` ADD `reserve_month` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD `obligation_occurrence_id` text;--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD `reservation_consumed_minor` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD `reservation_month` text DEFAULT '' NOT NULL;