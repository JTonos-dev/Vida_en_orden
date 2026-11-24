CREATE TABLE `home_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`task_id` text NOT NULL,
	`amount` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`date` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `home_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`task_id` text NOT NULL,
	`text` text NOT NULL,
	`author` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `home_tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`parent_id` text,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`priority` text DEFAULT 'P' NOT NULL,
	`effort` text DEFAULT 'media' NOT NULL,
	`owner` text DEFAULT '' NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`created_at` text,
	`updated_at` text NOT NULL,
	`completed_at` text,
	`done` integer DEFAULT 0 NOT NULL,
	`archived` integer DEFAULT 0 NOT NULL,
	`estimate` text,
	`actual` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`dependencies` text DEFAULT '[]' NOT NULL,
	`risk` text DEFAULT '' NOT NULL,
	`order_index` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `home_workspaces` (
	`user_id` text PRIMARY KEY NOT NULL,
	`budget_limit` text,
	`sort_mode` text DEFAULT 'manual' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
