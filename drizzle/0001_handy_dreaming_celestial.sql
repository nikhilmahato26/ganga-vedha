ALTER TABLE "adventures" ADD COLUMN "rapids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "river_status_label" varchar(60) DEFAULT 'Running today' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_settings" ADD COLUMN "gauge_location" varchar(60) DEFAULT 'Shivpuri' NOT NULL;