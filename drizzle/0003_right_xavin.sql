CREATE TYPE "public"."rental_kind" AS ENUM('car', 'bike');--> statement-breakpoint
ALTER TYPE "public"."adventure_kind" ADD VALUE 'paragliding';--> statement-breakpoint
ALTER TYPE "public"."adventure_kind" ADD VALUE 'zipline';--> statement-breakpoint
ALTER TYPE "public"."enquiry_source" ADD VALUE 'contact';--> statement-breakpoint
ALTER TYPE "public"."entity_kind" ADD VALUE 'package';--> statement-breakpoint
ALTER TYPE "public"."entity_kind" ADD VALUE 'destination';--> statement-breakpoint
ALTER TYPE "public"."service_key" ADD VALUE 'package';--> statement-breakpoint
ALTER TYPE "public"."service_key" ADD VALUE 'rental';--> statement-breakpoint
ALTER TYPE "public"."service_key" ADD VALUE 'activity';--> statement-breakpoint
ALTER TYPE "public"."service_key" ADD VALUE 'general';--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(120) NOT NULL,
	"region" varchar(80),
	"tagline" varchar(200),
	"intro" text,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"best_time" varchar(160),
	"how_to_reach" text,
	"faqs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover_media_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"seo_title" varchar(70),
	"seo_description" varchar(180),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(160) NOT NULL,
	"category" varchar(60),
	"destination_id" integer,
	"duration_label" varchar(60),
	"nights" integer,
	"route_label" varchar(200),
	"price_inr" integer NOT NULL,
	"compare_at_price_inr" integer,
	"price_note" varchar(80),
	"rating" numeric(2, 1),
	"review_count" integer,
	"badge" varchar(40),
	"summary" text,
	"description" text,
	"itinerary" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"inclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"accommodation_note" text,
	"transport_note" text,
	"meals_note" text,
	"terms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"faqs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover_media_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"seo_title" varchar(70),
	"seo_description" varchar(180),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "packages_price_positive" CHECK ("packages"."price_inr" >= 0),
	CONSTRAINT "packages_compare_price_higher" CHECK ("packages"."compare_at_price_inr" IS NULL OR "packages"."compare_at_price_inr" > "packages"."price_inr"),
	CONSTRAINT "packages_rating_range" CHECK ("packages"."rating" IS NULL OR ("packages"."rating" >= 0 AND "packages"."rating" <= 5))
);
--> statement-breakpoint
CREATE TABLE "rentals" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" "rental_kind" NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(160) NOT NULL,
	"per_day_inr" integer,
	"quote_only" boolean DEFAULT false NOT NULL,
	"deposit_inr" integer,
	"seats" smallint,
	"transmission" varchar(20),
	"fuel_note" varchar(80),
	"summary" text,
	"description" text,
	"includes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"documents_required" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"terms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pickup_note" text,
	"faqs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover_media_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"seo_title" varchar(70),
	"seo_description" varchar(180),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rentals_per_day_positive" CHECK ("rentals"."per_day_inr" IS NULL OR "rentals"."per_day_inr" >= 0),
	CONSTRAINT "rentals_quote_or_price" CHECK ("rentals"."quote_only" = true OR "rentals"."per_day_inr" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "enquiries" DROP CONSTRAINT "enquiries_one_product";--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "package_id" integer;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "rental_id" integer;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "subject" varchar(200);--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "album" varchar(80);--> statement-breakpoint
ALTER TABLE "hotels" ADD COLUMN "destination_id" integer;--> statement-breakpoint
ALTER TABLE "destinations" ADD CONSTRAINT "destinations_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packages" ADD CONSTRAINT "packages_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "destinations_slug_key" ON "destinations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "destinations_published_idx" ON "destinations" USING btree ("is_published","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "packages_slug_key" ON "packages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "packages_published_idx" ON "packages" USING btree ("is_published","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "rentals_slug_key" ON "rentals" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "rentals_kind_idx" ON "rentals" USING btree ("kind","is_published","sort_order");--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_package_id_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gallery_items_album_idx" ON "gallery_items" USING btree ("album","sort_order");--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_one_product" CHECK (num_nonnulls("enquiries"."adventure_id", "enquiries"."hotel_id", "enquiries"."package_id", "enquiries"."rental_id") <= 1);