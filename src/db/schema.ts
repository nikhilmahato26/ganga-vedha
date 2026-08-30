import {
  pgTable,
  pgEnum,
  serial,
  integer,
  smallint,
  text,
  varchar,
  boolean,
  numeric,
  date,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

/* =============================================================================
   Enums
   ========================================================================== */

/**
 * `rafting` and `bungee` are the original two. `paragliding` and `zipline` are
 * the "Other adventures" from the content blueprint — same table, same admin
 * form, distance/height left null and the price shown per person.
 */
export const adventureKind = pgEnum("adventure_kind", [
  "rafting",
  "bungee",
  "paragliding",
  "zipline",
]);
export const gradeLevel = pgEnum("grade_level", ["easy", "moderate", "challenging"]);
/**
 * `hotel` / `rafting` / `bungee` are the three homepage service lines. The rest
 * are enquiry product kinds only — a package, a rental, a non-river activity
 * (paragliding/zip-line), or a general contact-form message with no product
 * attached. They never create a service_lines row.
 */
export const serviceKey = pgEnum("service_key", [
  "hotel",
  "rafting",
  "bungee",
  "package",
  "rental",
  "activity",
  "general",
]);
export const closureScope = pgEnum("closure_scope", ["global", "service", "entity"]);
export const closureIcon = pgEnum("closure_icon", ["rain", "wrench", "calendar", "alert"]);
export const entityKind = pgEnum("entity_kind", [
  "hotel",
  "adventure",
  "gallery",
  "service_line",
  "review",
  "package",
  "destination",
]);
export const rentalKind = pgEnum("rental_kind", ["car", "bike"]);
export const enquiryStatus = pgEnum("enquiry_status", [
  "new",
  "contacted",
  "confirmed",
  "completed",
  "lost",
]);
export const enquirySource = pgEnum("enquiry_source", [
  "hero",
  "card",
  "detail",
  "floating",
  "admin",
  "contact",
]);
export const mediaKind = pgEnum("media_kind", ["image", "video"]);

/* =============================================================================
   Admin
   ========================================================================== */

export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 254 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("admin_users_email_key").on(sql`lower(${t.email})`)],
);

/* =============================================================================
   Media. Every image reference in the system is a media id, never a raw URL,
   so a Cloudinary asset can be deleted from exactly one place.
   ========================================================================== */

export const media = pgTable(
  "media",
  {
    id: serial("id").primaryKey(),
    publicId: varchar("public_id", { length: 255 }).notNull(),
    kind: mediaKind("kind").default("image").notNull(),
    secureUrl: text("secure_url").notNull(),
    width: integer("width"),
    height: integer("height"),
    format: varchar("format", { length: 16 }),
    bytes: integer("bytes"),
    /** Tiny base64 LQIP so a card never pops in blank on 4G. */
    placeholder: text("placeholder"),
    altText: varchar("alt_text", { length: 300 }),
    folder: varchar("folder", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("media_public_id_key").on(t.publicId)],
);

/**
 * Ordered galleries for every entity, in one table.
 * A row here is the ONLY thing that makes an image appear somewhere, which is
 * what makes orphan detection a single query rather than a guess.
 */
export const mediaLinks = pgTable(
  "media_links",
  {
    id: serial("id").primaryKey(),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    entityType: entityKind("entity_type").notNull(),
    entityId: integer("entity_id").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [
    uniqueIndex("media_links_unique").on(t.entityType, t.entityId, t.mediaId),
    index("media_links_entity_idx").on(t.entityType, t.entityId, t.sortOrder),
  ],
);

/**
 * The homepage gallery — photos curated on their own, not borrowed from a
 * specific hotel or rafting stretch's cover image. `category` reuses
 * `service_key` so it lines up with the same three services everywhere else
 * on the site; null is a photo that doesn't belong to just one of them
 * (the camp at sunset, the team, the put-in view) and still shows under "All".
 */
export const galleryItems = pgTable(
  "gallery_items",
  {
    id: serial("id").primaryKey(),
    mediaId: integer("media_id")
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    category: serviceKey("category"),
    /**
     * Free-text album name — "Rafting", "Bungee jumping", "Mountains",
     * "Resorts", "Rishikesh & the Ganga", "Manali", "Shimla". The gallery page
     * groups by whatever distinct values exist, so the owner can add an album
     * just by typing its name, without a schema change. `category` stays for
     * the homepage strip's three-service filter.
     */
    album: varchar("album", { length: 80 }),
    caption: varchar("caption", { length: 200 }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isPublished: boolean("is_published").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("gallery_items_sort_idx").on(t.sortOrder),
    index("gallery_items_album_idx").on(t.album, t.sortOrder),
  ],
);

/* =============================================================================
   Site-wide content
   ========================================================================== */

export const siteSettings = pgTable(
  "site_settings",
  {
    id: smallint("id").primaryKey().default(1),
    brandName: varchar("brand_name", { length: 120 }).default("Ganga Vedha").notNull(),
    tagline: varchar("tagline", { length: 200 }),
    whatsappNumber: varchar("whatsapp_number", { length: 20 }),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 254 }),
    address: text("address"),
    mapUrl: text("map_url"),
    socials: jsonb("socials").$type<Record<string, string>>().default({}).notNull(),
    heroHeading: text("hero_heading"),
    heroSubheading: text("hero_subheading"),
    heroMediaId: integer("hero_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    announcement: text("announcement"),
    announcementActive: boolean("announcement_active").default(false).notNull(),
    /** Copy for the pinned river-status strap, e.g. "Running today" / "Shivpuri". */
    riverStatusLabel: varchar("river_status_label", { length: 60 })
      .default("Running today")
      .notNull(),
    gaugeLocation: varchar("gauge_location", { length: 60 }).default("Shivpuri").notNull(),
    logoMediaId: integer("logo_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [check("site_settings_singleton", sql`${t.id} = 1`)],
);

/** The three landing cards. Exactly three rows, seeded, never created in admin. */
export const serviceLines = pgTable(
  "service_lines",
  {
    id: serial("id").primaryKey(),
    key: serviceKey("key").notNull(),
    label: varchar("label", { length: 80 }).notNull(),
    headline: varchar("headline", { length: 160 }),
    blurb: text("blurb"),
    href: varchar("href", { length: 120 }).notNull(),
    cardMediaId: integer("card_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("service_lines_key_key").on(t.key)],
);

/**
 * Editable page sections — "Why choose us", "Comfort highlights", "Our promise".
 * Keyed, not created freely, so a section can never lose its renderer.
 */
export const contentBlocks = pgTable(
  "content_blocks",
  {
    id: serial("id").primaryKey(),
    key: varchar("key", { length: 60 }).notNull(),
    title: varchar("title", { length: 160 }),
    subtitle: text("subtitle"),
    body: text("body"),
    items: jsonb("items").$type<unknown[]>().default([]).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("content_blocks_key_key").on(t.key)],
);

/* =============================================================================
   Products
   ========================================================================== */

/**
 * The places the company sells — Haridwar, Rishikesh, Dehradun, Mussoorie,
 * Tehri Lake, Nainital, Jim Corbett, Mukteshwar, Manali, Shimla. A destination
 * page pulls together its intro, best experiences, the stays that sit in it
 * (`hotels.destination_id`) and the packages that visit it
 * (`packages.destination_id`).
 */
export const destinations = pgTable(
  "destinations",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    /** "Uttarakhand" | "Himachal Pradesh" — groups the index page. */
    region: varchar("region", { length: 80 }),
    tagline: varchar("tagline", { length: 200 }),
    intro: text("intro"),
    /** "Best experiences" bullets. */
    highlights: jsonb("highlights").$type<string[]>().default([]).notNull(),
    bestTime: varchar("best_time", { length: 160 }),
    howToReach: text("how_to_reach"),
    faqs: jsonb("faqs").$type<{ q: string; a: string }[]>().default([]).notNull(),

    coverMediaId: integer("cover_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isPublished: boolean("is_published").default(false).notNull(),

    seoTitle: varchar("seo_title", { length: 70 }),
    seoDescription: varchar("seo_description", { length: 180 }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("destinations_slug_key").on(t.slug),
    index("destinations_published_idx").on(t.isPublished, t.sortOrder),
  ],
);

/**
 * Rafting stretches and bungee packages share one table and one admin form.
 * `distanceKm` is the axis the whole product is organised by; it is null for
 * bungee, where `heightM` carries the equivalent headline number.
 */
export const adventures = pgTable(
  "adventures",
  {
    id: serial("id").primaryKey(),
    kind: adventureKind("kind").notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),

    distanceKm: numeric("distance_km", { precision: 5, scale: 1 }),
    heightM: integer("height_m"),
    putInPoint: varchar("put_in_point", { length: 120 }),
    grade: gradeLevel("grade"),
    durationMinutes: integer("duration_minutes"),

    priceInr: integer("price_inr").notNull(),
    compareAtPriceInr: integer("compare_at_price_inr"),

    /** Placeholder until the client supplies real figures — never invented. */
    rating: numeric("rating", { precision: 2, scale: 1 }),
    reviewCount: integer("review_count"),
    badge: varchar("badge", { length: 40 }),
    bestFor: varchar("best_for", { length: 60 }),

    summary: text("summary"),
    description: text("description"),
    inclusions: jsonb("inclusions").$type<string[]>().default([]).notNull(),
    exclusions: jsonb("exclusions").$type<string[]>().default([]).notNull(),
    whatToBring: jsonb("what_to_bring").$type<string[]>().default([]).notNull(),
    faqs: jsonb("faqs").$type<{ q: string; a: string }[]>().default([]).notNull(),
    /** Named rapids on this stretch. Empty for bungee — a real content field, not seed-only. */
    rapids: jsonb("rapids").$type<string[]>().default([]).notNull(),

    meetingPoint: text("meeting_point"),
    minAge: integer("min_age"),
    minWeightKg: integer("min_weight_kg"),
    maxWeightKg: integer("max_weight_kg"),

    coverMediaId: integer("cover_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isPublished: boolean("is_published").default(false).notNull(),

    seoTitle: varchar("seo_title", { length: 70 }),
    seoDescription: varchar("seo_description", { length: 180 }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("adventures_slug_key").on(t.slug),
    index("adventures_kind_idx").on(t.kind, t.isPublished, t.sortOrder),
    check("adventures_price_positive", sql`${t.priceInr} >= 0`),
    check(
      "adventures_compare_price_higher",
      sql`${t.compareAtPriceInr} IS NULL OR ${t.compareAtPriceInr} > ${t.priceInr}`,
    ),
    check("adventures_rating_range", sql`${t.rating} IS NULL OR (${t.rating} >= 0 AND ${t.rating} <= 5)`),
    check(
      "adventures_rafting_has_distance",
      sql`${t.kind} <> 'rafting' OR ${t.distanceKm} IS NOT NULL`,
    ),
    check(
      "adventures_weight_range",
      sql`${t.minWeightKg} IS NULL OR ${t.maxWeightKg} IS NULL OR ${t.maxWeightKg} >= ${t.minWeightKg}`,
    ),
  ],
);

export const hotels = pgTable(
  "hotels",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    tagline: varchar("tagline", { length: 200 }),
    description: text("description"),

    address: text("address"),
    locality: varchar("locality", { length: 120 }),
    lat: numeric("lat", { precision: 9, scale: 6 }),
    lng: numeric("lng", { precision: 9, scale: 6 }),
    mapUrl: text("map_url"),
    /** Primary destination this stay sits in, for the /stays/[destination] page. */
    destinationId: integer("destination_id").references(() => destinations.id, {
      onDelete: "set null",
    }),

    starRating: smallint("star_rating"),
    pricePerNightInr: integer("price_per_night_inr").notNull(),
    compareAtPriceInr: integer("compare_at_price_inr"),

    rating: numeric("rating", { precision: 2, scale: 1 }),
    reviewCount: integer("review_count"),
    badge: varchar("badge", { length: 40 }),

    checkInTime: varchar("check_in_time", { length: 8 }),
    checkOutTime: varchar("check_out_time", { length: 8 }),
    amenities: jsonb("amenities").$type<string[]>().default([]).notNull(),
    houseRules: jsonb("house_rules").$type<string[]>().default([]).notNull(),
    faqs: jsonb("faqs").$type<{ q: string; a: string }[]>().default([]).notNull(),

    coverMediaId: integer("cover_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isPublished: boolean("is_published").default(false).notNull(),

    seoTitle: varchar("seo_title", { length: 70 }),
    seoDescription: varchar("seo_description", { length: 180 }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("hotels_slug_key").on(t.slug),
    index("hotels_published_idx").on(t.isPublished, t.sortOrder),
    check("hotels_price_positive", sql`${t.pricePerNightInr} >= 0`),
    check("hotels_star_range", sql`${t.starRating} IS NULL OR (${t.starRating} BETWEEN 1 AND 5)`),
    check("hotels_rating_range", sql`${t.rating} IS NULL OR (${t.rating} >= 0 AND ${t.rating} <= 5)`),
  ],
);

export const hotelRooms = pgTable(
  "hotel_rooms",
  {
    id: serial("id").primaryKey(),
    hotelId: integer("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    occupancy: smallint("occupancy").default(2).notNull(),
    bedType: varchar("bed_type", { length: 60 }),
    pricePerNightInr: integer("price_per_night_inr").notNull(),
    inclusions: jsonb("inclusions").$type<string[]>().default([]).notNull(),
    mediaId: integer("media_id").references(() => media.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => [
    index("hotel_rooms_hotel_idx").on(t.hotelId, t.sortOrder),
    check("hotel_rooms_price_positive", sql`${t.pricePerNightInr} >= 0`),
    check("hotel_rooms_occupancy_positive", sql`${t.occupancy} > 0`),
  ],
);

/**
 * Holiday packages — Yoga course, Char Dham / Do Dham yatra, and the multi-day
 * Rishikesh+Mussoorie / Shimla+Manali tours. `priceInr` is the "starting from"
 * figure; `itinerary` is a day-by-day list.
 */
export const packages = pgTable(
  "packages",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    /** "Pilgrimage", "Yoga & wellness", "Multi-day tour" — a small free-text grouping. */
    category: varchar("category", { length: 60 }),
    /** Primary destination, for cross-linking from a destination page. */
    destinationId: integer("destination_id").references(() => destinations.id, {
      onDelete: "set null",
    }),

    durationLabel: varchar("duration_label", { length: 60 }),
    nights: integer("nights"),
    routeLabel: varchar("route_label", { length: 200 }),

    priceInr: integer("price_inr").notNull(),
    compareAtPriceInr: integer("compare_at_price_inr"),
    priceNote: varchar("price_note", { length: 80 }),

    rating: numeric("rating", { precision: 2, scale: 1 }),
    reviewCount: integer("review_count"),
    badge: varchar("badge", { length: 40 }),

    summary: text("summary"),
    description: text("description"),
    itinerary: jsonb("itinerary")
      .$type<{ title: string; detail: string }[]>()
      .default([])
      .notNull(),
    inclusions: jsonb("inclusions").$type<string[]>().default([]).notNull(),
    exclusions: jsonb("exclusions").$type<string[]>().default([]).notNull(),
    accommodationNote: text("accommodation_note"),
    transportNote: text("transport_note"),
    mealsNote: text("meals_note"),
    terms: jsonb("terms").$type<string[]>().default([]).notNull(),
    faqs: jsonb("faqs").$type<{ q: string; a: string }[]>().default([]).notNull(),

    coverMediaId: integer("cover_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isPublished: boolean("is_published").default(false).notNull(),

    seoTitle: varchar("seo_title", { length: 70 }),
    seoDescription: varchar("seo_description", { length: 180 }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("packages_slug_key").on(t.slug),
    index("packages_published_idx").on(t.isPublished, t.sortOrder),
    check("packages_price_positive", sql`${t.priceInr} >= 0`),
    check(
      "packages_compare_price_higher",
      sql`${t.compareAtPriceInr} IS NULL OR ${t.compareAtPriceInr} > ${t.priceInr}`,
    ),
    check(
      "packages_rating_range",
      sql`${t.rating} IS NULL OR (${t.rating} >= 0 AND ${t.rating} <= 5)`,
    ),
  ],
);

/**
 * Car and bike rental. A car is quote-only (`quoteOnly = true`, `perDayInr`
 * null) — the enquiry is a request for a custom quotation. A bike carries a
 * real per-day rate.
 */
export const rentals = pgTable(
  "rentals",
  {
    id: serial("id").primaryKey(),
    kind: rentalKind("kind").notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),

    perDayInr: integer("per_day_inr"),
    quoteOnly: boolean("quote_only").default(false).notNull(),
    depositInr: integer("deposit_inr"),

    seats: smallint("seats"),
    /** A short vehicle-type / transmission label — "Sedan · SUV", "Geared scooter", "Manual". */
    transmission: varchar("transmission", { length: 60 }),
    fuelNote: varchar("fuel_note", { length: 100 }),

    summary: text("summary"),
    description: text("description"),
    includes: jsonb("includes").$type<string[]>().default([]).notNull(),
    documentsRequired: jsonb("documents_required").$type<string[]>().default([]).notNull(),
    terms: jsonb("terms").$type<string[]>().default([]).notNull(),
    pickupNote: text("pickup_note"),
    faqs: jsonb("faqs").$type<{ q: string; a: string }[]>().default([]).notNull(),

    coverMediaId: integer("cover_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").default(0).notNull(),
    isPublished: boolean("is_published").default(false).notNull(),

    seoTitle: varchar("seo_title", { length: 70 }),
    seoDescription: varchar("seo_description", { length: 180 }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("rentals_slug_key").on(t.slug),
    index("rentals_kind_idx").on(t.kind, t.isPublished, t.sortOrder),
    check(
      "rentals_per_day_positive",
      sql`${t.perDayInr} IS NULL OR ${t.perDayInr} >= 0`,
    ),
    check(
      "rentals_quote_or_price",
      sql`${t.quoteOnly} = true OR ${t.perDayInr} IS NOT NULL`,
    ),
  ],
);

/* =============================================================================
   Closures — the single source of truth for whether anything can be booked.

   There is deliberately NO `is_bookable` column on adventures or hotels.
   Two places to say "closed" is two places to forget. An entity is closed if
   and only if an active closure resolves to it, most specific scope winning:
   global > service > entity.
   ========================================================================== */

export const closures = pgTable(
  "closures",
  {
    id: serial("id").primaryKey(),
    scope: closureScope("scope").notNull(),
    /** Set when scope = 'service'. */
    serviceKey: serviceKey("service_key"),
    /** Both set when scope = 'entity'. */
    entityType: entityKind("entity_type"),
    entityId: integer("entity_id"),

    isActive: boolean("is_active").default(false).notNull(),
    icon: closureIcon("icon").default("rain").notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    body: text("body").notNull(),
    footnote: varchar("footnote", { length: 160 }),
    ctaLabel: varchar("cta_label", { length: 40 }).default("Got it").notNull(),

    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),

    /**
     * Bumped whenever the message changes. Dismissal is stored per
     * `closureId:version`, so editing the copy brings the notice back for
     * people who already dismissed the old one.
     */
    version: integer("version").default(1).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("closures_active_idx").on(t.isActive, t.scope),
    uniqueIndex("closures_global_key")
      .on(t.scope)
      .where(sql`${t.scope} = 'global'`),
    uniqueIndex("closures_service_key")
      .on(t.serviceKey)
      .where(sql`${t.scope} = 'service'`),
    uniqueIndex("closures_entity_key")
      .on(t.entityType, t.entityId)
      .where(sql`${t.scope} = 'entity'`),
    check(
      "closures_scope_shape",
      sql`(${t.scope} = 'global'  AND ${t.serviceKey} IS NULL AND ${t.entityType} IS NULL AND ${t.entityId} IS NULL)
       OR (${t.scope} = 'service' AND ${t.serviceKey} IS NOT NULL AND ${t.entityType} IS NULL AND ${t.entityId} IS NULL)
       OR (${t.scope} = 'entity'  AND ${t.serviceKey} IS NULL AND ${t.entityType} IS NOT NULL AND ${t.entityId} IS NOT NULL)`,
    ),
    check(
      "closures_window_ordered",
      sql`${t.startsAt} IS NULL OR ${t.endsAt} IS NULL OR ${t.endsAt} > ${t.startsAt}`,
    ),
  ],
);

/* =============================================================================
   Enquiries — captured leads, not paid orders.
   ========================================================================== */

export const enquiries = pgTable(
  "enquiries",
  {
    id: serial("id").primaryKey(),
    refCode: varchar("ref_code", { length: 12 }).notNull(),

    productKind: serviceKey("product_kind").notNull(),
    /**
     * SET NULL, never CASCADE: deleting a hotel must not delete the record of
     * forty people who asked about it. The snapshot columns below keep the
     * enquiry readable after the product is gone or repriced.
     */
    adventureId: integer("adventure_id").references(() => adventures.id, {
      onDelete: "set null",
    }),
    hotelId: integer("hotel_id").references(() => hotels.id, {
      onDelete: "set null",
    }),
    packageId: integer("package_id").references(() => packages.id, {
      onDelete: "set null",
    }),
    rentalId: integer("rental_id").references(() => rentals.id, {
      onDelete: "set null",
    }),
    productNameSnapshot: varchar("product_name_snapshot", { length: 200 }).notNull(),
    productPriceSnapshotInr: integer("product_price_snapshot_inr"),
    /** Free text from the contact form: the destination / activity / package the message is about. */
    subject: varchar("subject", { length: 200 }),

    name: varchar("name", { length: 120 }).notNull(),
    phone: varchar("phone", { length: 10 }).notNull(),
    email: varchar("email", { length: 254 }),
    travelDate: date("travel_date"),
    groupSize: smallint("group_size"),
    message: text("message"),

    source: enquirySource("source").default("card").notNull(),
    status: enquiryStatus("status").default("new").notNull(),
    adminNote: text("admin_note"),
    utm: jsonb("utm").$type<Record<string, string>>().default({}).notNull(),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgent: varchar("user_agent", { length: 300 }),

    contactedAt: timestamp("contacted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("enquiries_ref_code_key").on(t.refCode),
    index("enquiries_status_idx").on(t.status, t.createdAt),
    index("enquiries_created_idx").on(t.createdAt),
    index("enquiries_rate_limit_idx").on(t.ipHash, t.createdAt),
    check("enquiries_group_size", sql`${t.groupSize} IS NULL OR ${t.groupSize} > 0`),
    check("enquiries_phone_shape", sql`${t.phone} ~ '^[6-9][0-9]{9}$'`),
    check(
      "enquiries_one_product",
      sql`num_nonnulls(${t.adventureId}, ${t.hotelId}, ${t.packageId}, ${t.rentalId}) <= 1`,
    ),
  ],
);

/* =============================================================================
   Social proof
   ========================================================================== */

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    authorName: varchar("author_name", { length: 120 }).notNull(),
    rating: smallint("rating").notNull(),
    body: text("body").notNull(),
    source: varchar("source", { length: 40 }).default("manual").notNull(),
    tripLabel: varchar("trip_label", { length: 80 }),
    avatarMediaId: integer("avatar_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    isPublished: boolean("is_published").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("reviews_published_idx").on(t.isPublished, t.sortOrder),
    check("reviews_rating_range", sql`${t.rating} BETWEEN 1 AND 5`),
  ],
);

/* =============================================================================
   Audit
   ========================================================================== */

export const auditLog = pgTable(
  "audit_log",
  {
    id: serial("id").primaryKey(),
    adminUserId: integer("admin_user_id").references(() => adminUsers.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 40 }).notNull(),
    entityType: varchar("entity_type", { length: 40 }).notNull(),
    entityId: integer("entity_id"),
    label: varchar("label", { length: 200 }),
    diff: jsonb("diff").$type<Record<string, { from: unknown; to: unknown }>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_log_created_idx").on(t.createdAt)],
);

/* =============================================================================
   Relations — enables db.query.hotels.findMany({ with: { rooms: true } })
   ========================================================================== */

export const hotelsRelations = relations(hotels, ({ many, one }) => ({
  rooms: many(hotelRooms),
  destination: one(destinations, {
    fields: [hotels.destinationId],
    references: [destinations.id],
  }),
}));

export const hotelRoomsRelations = relations(hotelRooms, ({ one }) => ({
  hotel: one(hotels, {
    fields: [hotelRooms.hotelId],
    references: [hotels.id],
  }),
}));

export const destinationsRelations = relations(destinations, ({ many }) => ({
  hotels: many(hotels),
  packages: many(packages),
}));

export const packagesRelations = relations(packages, ({ one }) => ({
  destination: one(destinations, {
    fields: [packages.destinationId],
    references: [destinations.id],
  }),
}));

/* =============================================================================
   Inferred types
   ========================================================================== */

export type Media = typeof media.$inferSelect;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type Adventure = typeof adventures.$inferSelect;
export type Hotel = typeof hotels.$inferSelect;
export type HotelRoom = typeof hotelRooms.$inferSelect;
export type Destination = typeof destinations.$inferSelect;
export type Package = typeof packages.$inferSelect;
export type Rental = typeof rentals.$inferSelect;
export type Closure = typeof closures.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type ServiceLine = typeof serviceLines.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type ContentBlock = typeof contentBlocks.$inferSelect;
export type AdminUser = typeof adminUsers.$inferSelect;
