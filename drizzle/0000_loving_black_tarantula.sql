CREATE TYPE "public"."adventure_kind" AS ENUM('rafting', 'bungee');--> statement-breakpoint
CREATE TYPE "public"."closure_icon" AS ENUM('rain', 'wrench', 'calendar', 'alert');--> statement-breakpoint
CREATE TYPE "public"."closure_scope" AS ENUM('global', 'service', 'entity');--> statement-breakpoint
CREATE TYPE "public"."enquiry_source" AS ENUM('hero', 'card', 'detail', 'floating', 'admin');--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM('new', 'contacted', 'confirmed', 'completed', 'lost');--> statement-breakpoint
CREATE TYPE "public"."entity_kind" AS ENUM('hotel', 'adventure', 'gallery', 'service_line', 'review');--> statement-breakpoint
CREATE TYPE "public"."grade_level" AS ENUM('easy', 'moderate', 'challenging');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."service_key" AS ENUM('hotel', 'rafting', 'bungee');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(120) NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "adventures" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" "adventure_kind" NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(160) NOT NULL,
	"distance_km" numeric(5, 1),
	"height_m" integer,
	"put_in_point" varchar(120),
	"grade" "grade_level",
	"duration_minutes" integer,
	"price_inr" integer NOT NULL,
	"compare_at_price_inr" integer,
	"rating" numeric(2, 1),
	"review_count" integer,
	"badge" varchar(40),
	"best_for" varchar(60),
	"summary" text,
	"description" text,
	"inclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"what_to_bring" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"faqs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"meeting_point" text,
	"min_age" integer,
	"min_weight_kg" integer,
	"max_weight_kg" integer,
	"cover_media_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"seo_title" varchar(70),
	"seo_description" varchar(180),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "adventures_price_positive" CHECK ("adventures"."price_inr" >= 0),
	CONSTRAINT "adventures_compare_price_higher" CHECK ("adventures"."compare_at_price_inr" IS NULL OR "adventures"."compare_at_price_inr" > "adventures"."price_inr"),
	CONSTRAINT "adventures_rating_range" CHECK ("adventures"."rating" IS NULL OR ("adventures"."rating" >= 0 AND "adventures"."rating" <= 5)),
	CONSTRAINT "adventures_rafting_has_distance" CHECK ("adventures"."kind" <> 'rafting' OR "adventures"."distance_km" IS NOT NULL),
	CONSTRAINT "adventures_weight_range" CHECK ("adventures"."min_weight_kg" IS NULL OR "adventures"."max_weight_kg" IS NULL OR "adventures"."max_weight_kg" >= "adventures"."min_weight_kg")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_user_id" integer,
	"action" varchar(40) NOT NULL,
	"entity_type" varchar(40) NOT NULL,
	"entity_id" integer,
	"label" varchar(200),
	"diff" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "closures" (
	"id" serial PRIMARY KEY NOT NULL,
	"scope" "closure_scope" NOT NULL,
	"service_key" "service_key",
	"entity_type" "entity_kind",
	"entity_id" integer,
	"is_active" boolean DEFAULT false NOT NULL,
	"icon" "closure_icon" DEFAULT 'rain' NOT NULL,
	"title" varchar(160) NOT NULL,
	"body" text NOT NULL,
	"footnote" varchar(160),
	"cta_label" varchar(40) DEFAULT 'Got it' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "closures_scope_shape" CHECK (("closures"."scope" = 'global'  AND "closures"."service_key" IS NULL AND "closures"."entity_type" IS NULL AND "closures"."entity_id" IS NULL)
       OR ("closures"."scope" = 'service' AND "closures"."service_key" IS NOT NULL AND "closures"."entity_type" IS NULL AND "closures"."entity_id" IS NULL)
       OR ("closures"."scope" = 'entity'  AND "closures"."service_key" IS NULL AND "closures"."entity_type" IS NOT NULL AND "closures"."entity_id" IS NOT NULL)),
	CONSTRAINT "closures_window_ordered" CHECK ("closures"."starts_at" IS NULL OR "closures"."ends_at" IS NULL OR "closures"."ends_at" > "closures"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "content_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(60) NOT NULL,
	"title" varchar(160),
	"subtitle" text,
	"body" text,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"ref_code" varchar(12) NOT NULL,
	"product_kind" "service_key" NOT NULL,
	"adventure_id" integer,
	"hotel_id" integer,
	"product_name_snapshot" varchar(200) NOT NULL,
	"product_price_snapshot_inr" integer,
	"name" varchar(120) NOT NULL,
	"phone" varchar(10) NOT NULL,
	"email" varchar(254),
	"travel_date" date,
	"group_size" smallint,
	"message" text,
	"source" "enquiry_source" DEFAULT 'card' NOT NULL,
	"status" "enquiry_status" DEFAULT 'new' NOT NULL,
	"admin_note" text,
	"utm" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ip_hash" varchar(64),
	"user_agent" varchar(300),
	"contacted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enquiries_group_size" CHECK ("enquiries"."group_size" IS NULL OR "enquiries"."group_size" > 0),
	CONSTRAINT "enquiries_phone_shape" CHECK ("enquiries"."phone" ~ '^[6-9][0-9]{9}$'),
	CONSTRAINT "enquiries_one_product" CHECK (num_nonnulls("enquiries"."adventure_id", "enquiries"."hotel_id") <= 1)
);
--> statement-breakpoint
CREATE TABLE "hotel_rooms" (
	"id" serial PRIMARY KEY NOT NULL,
	"hotel_id" integer NOT NULL,
	"name" varchar(120) NOT NULL,
	"occupancy" smallint DEFAULT 2 NOT NULL,
	"bed_type" varchar(60),
	"price_per_night_inr" integer NOT NULL,
	"inclusions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"media_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "hotel_rooms_price_positive" CHECK ("hotel_rooms"."price_per_night_inr" >= 0),
	CONSTRAINT "hotel_rooms_occupancy_positive" CHECK ("hotel_rooms"."occupancy" > 0)
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(160) NOT NULL,
	"tagline" varchar(200),
	"description" text,
	"address" text,
	"locality" varchar(120),
	"lat" numeric(9, 6),
	"lng" numeric(9, 6),
	"map_url" text,
	"star_rating" smallint,
	"price_per_night_inr" integer NOT NULL,
	"compare_at_price_inr" integer,
	"rating" numeric(2, 1),
	"review_count" integer,
	"badge" varchar(40),
	"check_in_time" varchar(8),
	"check_out_time" varchar(8),
	"amenities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"house_rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"faqs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cover_media_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"seo_title" varchar(70),
	"seo_description" varchar(180),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotels_price_positive" CHECK ("hotels"."price_per_night_inr" >= 0),
	CONSTRAINT "hotels_star_range" CHECK ("hotels"."star_rating" IS NULL OR ("hotels"."star_rating" BETWEEN 1 AND 5)),
	CONSTRAINT "hotels_rating_range" CHECK ("hotels"."rating" IS NULL OR ("hotels"."rating" >= 0 AND "hotels"."rating" <= 5))
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" varchar(255) NOT NULL,
	"kind" "media_kind" DEFAULT 'image' NOT NULL,
	"secure_url" text NOT NULL,
	"width" integer,
	"height" integer,
	"format" varchar(16),
	"bytes" integer,
	"placeholder" text,
	"alt_text" varchar(300),
	"folder" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer NOT NULL,
	"entity_type" "entity_kind" NOT NULL,
	"entity_id" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_name" varchar(120) NOT NULL,
	"rating" smallint NOT NULL,
	"body" text NOT NULL,
	"source" varchar(40) DEFAULT 'manual' NOT NULL,
	"trip_label" varchar(80),
	"avatar_media_id" integer,
	"is_published" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE TABLE "service_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" "service_key" NOT NULL,
	"label" varchar(80) NOT NULL,
	"headline" varchar(160),
	"blurb" text,
	"href" varchar(120) NOT NULL,
	"card_media_id" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"brand_name" varchar(120) DEFAULT 'Ganga Vedha' NOT NULL,
	"tagline" varchar(200),
	"whatsapp_number" varchar(20),
	"phone" varchar(20),
	"email" varchar(254),
	"address" text,
	"map_url" text,
	"socials" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"hero_heading" text,
	"hero_subheading" text,
	"hero_media_id" integer,
	"announcement" text,
	"announcement_active" boolean DEFAULT false NOT NULL,
	"logo_media_id" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton" CHECK ("site_settings"."id" = 1)
);
--> statement-breakpoint
ALTER TABLE "adventures" ADD CONSTRAINT "adventures_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_adventure_id_adventures_id_fk" FOREIGN KEY ("adventure_id") REFERENCES "public"."adventures"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_rooms" ADD CONSTRAINT "hotel_rooms_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_rooms" ADD CONSTRAINT "hotel_rooms_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_links" ADD CONSTRAINT "media_links_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_avatar_media_id_media_id_fk" FOREIGN KEY ("avatar_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_lines" ADD CONSTRAINT "service_lines_card_media_id_media_id_fk" FOREIGN KEY ("card_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_media_id_media_id_fk" FOREIGN KEY ("logo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "adventures_slug_key" ON "adventures" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "adventures_kind_idx" ON "adventures" USING btree ("kind","is_published","sort_order");--> statement-breakpoint
CREATE INDEX "audit_log_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "closures_active_idx" ON "closures" USING btree ("is_active","scope");--> statement-breakpoint
CREATE UNIQUE INDEX "closures_global_key" ON "closures" USING btree ("scope") WHERE "closures"."scope" = 'global';--> statement-breakpoint
CREATE UNIQUE INDEX "closures_service_key" ON "closures" USING btree ("service_key") WHERE "closures"."scope" = 'service';--> statement-breakpoint
CREATE UNIQUE INDEX "closures_entity_key" ON "closures" USING btree ("entity_type","entity_id") WHERE "closures"."scope" = 'entity';--> statement-breakpoint
CREATE UNIQUE INDEX "content_blocks_key_key" ON "content_blocks" USING btree ("key");--> statement-breakpoint
CREATE UNIQUE INDEX "enquiries_ref_code_key" ON "enquiries" USING btree ("ref_code");--> statement-breakpoint
CREATE INDEX "enquiries_status_idx" ON "enquiries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "enquiries_created_idx" ON "enquiries" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "enquiries_rate_limit_idx" ON "enquiries" USING btree ("ip_hash","created_at");--> statement-breakpoint
CREATE INDEX "hotel_rooms_hotel_idx" ON "hotel_rooms" USING btree ("hotel_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "hotels_slug_key" ON "hotels" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "hotels_published_idx" ON "hotels" USING btree ("is_published","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "media_public_id_key" ON "media" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "media_links_unique" ON "media_links" USING btree ("entity_type","entity_id","media_id");--> statement-breakpoint
CREATE INDEX "media_links_entity_idx" ON "media_links" USING btree ("entity_type","entity_id","sort_order");--> statement-breakpoint
CREATE INDEX "reviews_published_idx" ON "reviews" USING btree ("is_published","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "service_lines_key_key" ON "service_lines" USING btree ("key");