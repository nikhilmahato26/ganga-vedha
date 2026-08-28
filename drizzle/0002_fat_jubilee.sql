CREATE TABLE "gallery_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"media_id" integer NOT NULL,
	"category" "service_key",
	"caption" varchar(200),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gallery_items" ADD CONSTRAINT "gallery_items_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gallery_items_sort_idx" ON "gallery_items" USING btree ("sort_order");