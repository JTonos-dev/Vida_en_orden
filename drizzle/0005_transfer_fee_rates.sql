ALTER TABLE `finance_settings` ADD `transfer_same_bank_rate_bps` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_settings` ADD `transfer_ach_rate_bps` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `finance_settings` ADD `transfer_lbtr_surcharge_minor` integer DEFAULT 0 NOT NULL;
