ALTER TABLE `finance_accounts` ADD `bank_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD `transfer_mode` text;--> statement-breakpoint
ALTER TABLE `finance_transactions` ADD `fee_minor` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_settings` ADD `transfer_same_bank_fee_minor` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_settings` ADD `transfer_ach_fee_minor` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_settings` ADD `transfer_lbtr_fee_minor` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_settings` ADD `transfer_bank_fees_json` text DEFAULT '{}' NOT NULL;
