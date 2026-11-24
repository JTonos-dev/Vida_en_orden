ALTER TABLE `finance_obligations` ADD `concept` text DEFAULT '' NOT NULL;
--> statement-breakpoint
CREATE TABLE `finance_concepts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`concept` text NOT NULL,
	`normalized` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `finance_concepts_owner_normalized_idx` ON `finance_concepts` (`owner_id`,`normalized`);
