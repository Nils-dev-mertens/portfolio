CREATE TABLE `about` (
	`id` text PRIMARY KEY NOT NULL,
	`location` text NOT NULL,
	`email` text NOT NULL,
	`github_url` text NOT NULL,
	`status_label` text NOT NULL,
	`status_active` integer DEFAULT true NOT NULL,
	`tagline` text NOT NULL,
	`quote` text NOT NULL,
	`quote_sub` text NOT NULL,
	`bio_landing` text DEFAULT '[]' NOT NULL,
	`bio_about` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `education` (
	`id` text PRIMARY KEY NOT NULL,
	`institution` text NOT NULL,
	`program` text NOT NULL,
	`description` text,
	`start_date` text NOT NULL,
	`end_date` text
);
--> statement-breakpoint
CREATE TABLE `work_experience` (
	`id` text PRIMARY KEY NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`description` text,
	`start_date` text NOT NULL,
	`end_date` text,
	`current` integer DEFAULT false NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
DROP TABLE `blog_posts`;--> statement-breakpoint
ALTER TABLE `projects` ADD `category` text DEFAULT 'other' NOT NULL;