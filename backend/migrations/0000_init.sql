CREATE TABLE `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`last_login_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_key` ON `admin_users` (lower("email"));--> statement-breakpoint
CREATE TABLE `adventures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`distance_km` real,
	`height_m` integer,
	`put_in_point` text,
	`grade` text,
	`duration_minutes` integer,
	`price_inr` integer NOT NULL,
	`compare_at_price_inr` integer,
	`rating` real,
	`review_count` integer,
	`badge` text,
	`best_for` text,
	`brand` text,
	`summary` text,
	`description` text,
	`inclusions` text DEFAULT '[]' NOT NULL,
	`exclusions` text DEFAULT '[]' NOT NULL,
	`what_to_bring` text DEFAULT '[]' NOT NULL,
	`faqs` text DEFAULT '[]' NOT NULL,
	`rapids` text DEFAULT '[]' NOT NULL,
	`meeting_point` text,
	`min_age` integer,
	`min_weight_kg` integer,
	`max_weight_kg` integer,
	`cover_media_id` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "adventures_kind_check" CHECK("adventures"."kind" IN ('rafting', 'bungee', 'paragliding', 'zipline')),
	CONSTRAINT "adventures_grade_check" CHECK("adventures"."grade" IS NULL OR "adventures"."grade" IN ('easy', 'moderate', 'challenging')),
	CONSTRAINT "adventures_price_positive" CHECK("adventures"."price_inr" >= 0),
	CONSTRAINT "adventures_compare_price_higher" CHECK("adventures"."compare_at_price_inr" IS NULL OR "adventures"."compare_at_price_inr" > "adventures"."price_inr"),
	CONSTRAINT "adventures_rating_range" CHECK("adventures"."rating" IS NULL OR ("adventures"."rating" >= 0 AND "adventures"."rating" <= 5)),
	CONSTRAINT "adventures_rafting_has_distance" CHECK("adventures"."kind" <> 'rafting' OR "adventures"."distance_km" IS NOT NULL),
	CONSTRAINT "adventures_weight_range" CHECK("adventures"."min_weight_kg" IS NULL OR "adventures"."max_weight_kg" IS NULL OR "adventures"."max_weight_kg" >= "adventures"."min_weight_kg")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `adventures_slug_key` ON `adventures` (`slug`);--> statement-breakpoint
CREATE INDEX `adventures_kind_idx` ON `adventures` (`kind`,`is_published`,`sort_order`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admin_user_id` integer,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer,
	`label` text,
	`diff` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `audit_log_created_idx` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `closures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`scope` text NOT NULL,
	`service_key` text,
	`entity_type` text,
	`entity_id` integer,
	`is_active` integer DEFAULT false NOT NULL,
	`icon` text DEFAULT 'rain' NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`footnote` text,
	`cta_label` text DEFAULT 'Got it' NOT NULL,
	`starts_at` text,
	`ends_at` text,
	`version` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "closures_scope_check" CHECK("closures"."scope" IN ('global', 'service', 'entity')),
	CONSTRAINT "closures_icon_check" CHECK("closures"."icon" IN ('rain', 'wrench', 'calendar', 'alert')),
	CONSTRAINT "closures_scope_shape" CHECK(("closures"."scope" = 'global' AND "closures"."service_key" IS NULL AND "closures"."entity_type" IS NULL AND "closures"."entity_id" IS NULL)
       OR ("closures"."scope" = 'service' AND "closures"."service_key" IS NOT NULL AND "closures"."entity_type" IS NULL AND "closures"."entity_id" IS NULL)
       OR ("closures"."scope" = 'entity' AND "closures"."service_key" IS NULL AND "closures"."entity_type" IS NOT NULL AND "closures"."entity_id" IS NOT NULL)),
	CONSTRAINT "closures_window_ordered" CHECK("closures"."starts_at" IS NULL OR "closures"."ends_at" IS NULL OR "closures"."ends_at" > "closures"."starts_at")
);
--> statement-breakpoint
CREATE INDEX `closures_active_idx` ON `closures` (`is_active`,`scope`);--> statement-breakpoint
CREATE UNIQUE INDEX `closures_global_key` ON `closures` (`scope`) WHERE "closures"."scope" = 'global';--> statement-breakpoint
CREATE UNIQUE INDEX `closures_service_key` ON `closures` (`service_key`) WHERE "closures"."scope" = 'service';--> statement-breakpoint
CREATE UNIQUE INDEX `closures_entity_key` ON `closures` (`entity_type`,`entity_id`) WHERE "closures"."scope" = 'entity';--> statement-breakpoint
CREATE TABLE `content_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`title` text,
	`subtitle` text,
	`body` text,
	`items` text DEFAULT '[]' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_blocks_key_key` ON `content_blocks` (`key`);--> statement-breakpoint
CREATE TABLE `destinations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`region` text,
	`tagline` text,
	`intro` text,
	`highlights` text DEFAULT '[]' NOT NULL,
	`best_time` text,
	`how_to_reach` text,
	`faqs` text DEFAULT '[]' NOT NULL,
	`cover_media_id` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `destinations_slug_key` ON `destinations` (`slug`);--> statement-breakpoint
CREATE INDEX `destinations_published_idx` ON `destinations` (`is_published`,`sort_order`);--> statement-breakpoint
CREATE TABLE `enquiries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ref_code` text NOT NULL,
	`product_kind` text NOT NULL,
	`adventure_id` integer,
	`hotel_id` integer,
	`package_id` integer,
	`rental_id` integer,
	`product_name_snapshot` text NOT NULL,
	`product_price_snapshot_inr` integer,
	`subject` text,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`state` text,
	`travel_date` text,
	`group_size` integer,
	`message` text,
	`source` text DEFAULT 'card' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`admin_note` text,
	`utm` text DEFAULT '{}' NOT NULL,
	`ip_hash` text,
	`user_agent` text,
	`contacted_at` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`adventure_id`) REFERENCES `adventures`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`package_id`) REFERENCES `packages`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`rental_id`) REFERENCES `rentals`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "enquiries_product_kind_check" CHECK("enquiries"."product_kind" IN ('hotel', 'rafting', 'bungee', 'package', 'rental', 'activity', 'general')),
	CONSTRAINT "enquiries_source_check" CHECK("enquiries"."source" IN ('hero', 'card', 'detail', 'floating', 'admin', 'contact')),
	CONSTRAINT "enquiries_status_check" CHECK("enquiries"."status" IN ('new', 'contacted', 'confirmed', 'completed', 'lost')),
	CONSTRAINT "enquiries_group_size" CHECK("enquiries"."group_size" IS NULL OR "enquiries"."group_size" > 0),
	CONSTRAINT "enquiries_phone_shape" CHECK("enquiries"."phone" GLOB '[6-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
	CONSTRAINT "enquiries_one_product" CHECK(("enquiries"."adventure_id" IS NOT NULL) + ("enquiries"."hotel_id" IS NOT NULL) + ("enquiries"."package_id" IS NOT NULL) + ("enquiries"."rental_id" IS NOT NULL) <= 1)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enquiries_ref_code_key` ON `enquiries` (`ref_code`);--> statement-breakpoint
CREATE INDEX `enquiries_status_idx` ON `enquiries` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `enquiries_created_idx` ON `enquiries` (`created_at`);--> statement-breakpoint
CREATE INDEX `enquiries_rate_limit_idx` ON `enquiries` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `gallery_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`media_id` integer NOT NULL,
	`category` text,
	`album` text,
	`caption` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "gallery_items_category_check" CHECK("gallery_items"."category" IS NULL OR "gallery_items"."category" IN ('hotel', 'rafting', 'bungee', 'package', 'rental', 'activity', 'general'))
);
--> statement-breakpoint
CREATE INDEX `gallery_items_sort_idx` ON `gallery_items` (`sort_order`);--> statement-breakpoint
CREATE INDEX `gallery_items_album_idx` ON `gallery_items` (`album`,`sort_order`);--> statement-breakpoint
CREATE TABLE `hotel_rooms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hotel_id` integer NOT NULL,
	`name` text NOT NULL,
	`occupancy` integer DEFAULT 2 NOT NULL,
	`bed_type` text,
	`price_per_night_inr` integer NOT NULL,
	`inclusions` text DEFAULT '[]' NOT NULL,
	`media_id` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`hotel_id`) REFERENCES `hotels`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "hotel_rooms_price_positive" CHECK("hotel_rooms"."price_per_night_inr" >= 0),
	CONSTRAINT "hotel_rooms_occupancy_positive" CHECK("hotel_rooms"."occupancy" > 0)
);
--> statement-breakpoint
CREATE INDEX `hotel_rooms_hotel_idx` ON `hotel_rooms` (`hotel_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `hotels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`tagline` text,
	`description` text,
	`address` text,
	`locality` text,
	`lat` real,
	`lng` real,
	`map_url` text,
	`destination_id` integer,
	`star_rating` integer,
	`price_per_night_inr` integer NOT NULL,
	`compare_at_price_inr` integer,
	`rating` real,
	`review_count` integer,
	`badge` text,
	`check_in_time` text,
	`check_out_time` text,
	`amenities` text DEFAULT '[]' NOT NULL,
	`house_rules` text DEFAULT '[]' NOT NULL,
	`faqs` text DEFAULT '[]' NOT NULL,
	`cover_media_id` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`destination_id`) REFERENCES `destinations`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "hotels_price_positive" CHECK("hotels"."price_per_night_inr" >= 0),
	CONSTRAINT "hotels_star_range" CHECK("hotels"."star_rating" IS NULL OR ("hotels"."star_rating" BETWEEN 1 AND 5)),
	CONSTRAINT "hotels_rating_range" CHECK("hotels"."rating" IS NULL OR ("hotels"."rating" >= 0 AND "hotels"."rating" <= 5))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hotels_slug_key` ON `hotels` (`slug`);--> statement-breakpoint
CREATE INDEX `hotels_published_idx` ON `hotels` (`is_published`,`sort_order`);--> statement-breakpoint
CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`kind` text DEFAULT 'image' NOT NULL,
	`secure_url` text NOT NULL,
	`width` integer,
	`height` integer,
	`format` text,
	`bytes` integer,
	`placeholder` text,
	`alt_text` text,
	`folder` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT "media_kind_check" CHECK("media"."kind" IN ('image', 'video'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_public_id_key` ON `media` (`public_id`);--> statement-breakpoint
CREATE TABLE `media_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`media_id` integer NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "media_links_entity_type_check" CHECK("media_links"."entity_type" IN ('hotel', 'adventure', 'gallery', 'service_line', 'review', 'package', 'destination'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_links_unique` ON `media_links` (`entity_type`,`entity_id`,`media_id`);--> statement-breakpoint
CREATE INDEX `media_links_entity_idx` ON `media_links` (`entity_type`,`entity_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `packages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`category` text,
	`destination_id` integer,
	`duration_label` text,
	`nights` integer,
	`route_label` text,
	`price_inr` integer NOT NULL,
	`compare_at_price_inr` integer,
	`price_note` text,
	`rating` real,
	`review_count` integer,
	`badge` text,
	`summary` text,
	`description` text,
	`itinerary` text DEFAULT '[]' NOT NULL,
	`inclusions` text DEFAULT '[]' NOT NULL,
	`exclusions` text DEFAULT '[]' NOT NULL,
	`accommodation_note` text,
	`transport_note` text,
	`meals_note` text,
	`terms` text DEFAULT '[]' NOT NULL,
	`faqs` text DEFAULT '[]' NOT NULL,
	`cover_media_id` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`destination_id`) REFERENCES `destinations`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "packages_price_positive" CHECK("packages"."price_inr" >= 0),
	CONSTRAINT "packages_compare_price_higher" CHECK("packages"."compare_at_price_inr" IS NULL OR "packages"."compare_at_price_inr" > "packages"."price_inr"),
	CONSTRAINT "packages_rating_range" CHECK("packages"."rating" IS NULL OR ("packages"."rating" >= 0 AND "packages"."rating" <= 5))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `packages_slug_key` ON `packages` (`slug`);--> statement-breakpoint
CREATE INDEX `packages_published_idx` ON `packages` (`is_published`,`sort_order`);--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`cta_label` text,
	`cta_href` text,
	`media_id` integer,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `promotions_active_idx` ON `promotions` (`is_active`,`sort_order`);--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rentals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`per_day_inr` integer,
	`quote_only` integer DEFAULT false NOT NULL,
	`deposit_inr` integer,
	`seats` integer,
	`transmission` text,
	`fuel_note` text,
	`summary` text,
	`description` text,
	`includes` text DEFAULT '[]' NOT NULL,
	`documents_required` text DEFAULT '[]' NOT NULL,
	`terms` text DEFAULT '[]' NOT NULL,
	`pickup_note` text,
	`faqs` text DEFAULT '[]' NOT NULL,
	`cover_media_id` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_published` integer DEFAULT false NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`cover_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "rentals_kind_check" CHECK("rentals"."kind" IN ('car', 'bike')),
	CONSTRAINT "rentals_per_day_positive" CHECK("rentals"."per_day_inr" IS NULL OR "rentals"."per_day_inr" >= 0),
	CONSTRAINT "rentals_quote_or_price" CHECK("rentals"."quote_only" = 1 OR "rentals"."per_day_inr" IS NOT NULL)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rentals_slug_key` ON `rentals` (`slug`);--> statement-breakpoint
CREATE INDEX `rentals_kind_idx` ON `rentals` (`kind`,`is_published`,`sort_order`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`author_name` text NOT NULL,
	`rating` integer NOT NULL,
	`body` text NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`trip_label` text,
	`avatar_media_id` integer,
	`is_published` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`avatar_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "reviews_rating_range" CHECK("reviews"."rating" BETWEEN 1 AND 5)
);
--> statement-breakpoint
CREATE INDEX `reviews_published_idx` ON `reviews` (`is_published`,`sort_order`);--> statement-breakpoint
CREATE TABLE `service_lines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`label` text NOT NULL,
	`headline` text,
	`blurb` text,
	`href` text NOT NULL,
	`card_media_id` integer,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`card_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "service_lines_key_check" CHECK("service_lines"."key" IN ('hotel', 'rafting', 'bungee', 'package', 'rental', 'activity', 'general'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `service_lines_key_key` ON `service_lines` (`key`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`brand_name` text DEFAULT 'Ganga Vedha' NOT NULL,
	`tagline` text,
	`whatsapp_number` text,
	`phone` text,
	`email` text,
	`address` text,
	`map_url` text,
	`socials` text DEFAULT '{}' NOT NULL,
	`hero_heading` text,
	`hero_subheading` text,
	`hero_media_id` integer,
	`announcement` text,
	`announcement_active` integer DEFAULT false NOT NULL,
	`river_status_label` text DEFAULT 'Running today' NOT NULL,
	`gauge_location` text DEFAULT 'Shivpuri' NOT NULL,
	`logo_media_id` integer,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`hero_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`logo_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "site_settings_singleton" CHECK("site_settings"."id" = 1)
);
