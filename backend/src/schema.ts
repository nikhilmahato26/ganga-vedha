import { relations, sql } from 'drizzle-orm'
import { check, index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

/**
 * Ganga Vedha's D1 schema (SQLite). Ported 1:1 from the original Neon/Postgres schema:
 * - timestamps are ISO-8601 UTC text (`nowIso()` in db.ts), never Date objects;
 * - Postgres numerics (rating, distance, lat/lng) are `real`;
 * - enums are text columns with CHECK constraints (D1 has no enum type);
 * - jsonb is JSON text (`mode: 'json'`), typed with `$type`.
 * Every change is a new file in migrations/ (`pnpm db:generate`); never edit an applied one.
 */

/* Enum values: one list per enum, shared by the column type and its CHECK. */

export const ADVENTURE_KINDS = ['rafting', 'bungee', 'paragliding', 'zipline'] as const
export const GRADE_LEVELS = ['easy', 'moderate', 'challenging'] as const
/**
 * `hotel` / `rafting` / `bungee` are the three homepage service lines. The rest are enquiry
 * product kinds only and never create a service_lines row.
 */
export const SERVICE_KEYS = ['hotel', 'rafting', 'bungee', 'package', 'rental', 'activity', 'general'] as const
export const CLOSURE_SCOPES = ['global', 'service', 'entity'] as const
export const CLOSURE_ICONS = ['rain', 'wrench', 'calendar', 'alert'] as const
export const ENTITY_KINDS = ['hotel', 'adventure', 'gallery', 'service_line', 'review', 'package', 'destination'] as const
export const RENTAL_KINDS = ['car', 'bike'] as const
export const ENQUIRY_STATUSES = ['new', 'contacted', 'confirmed', 'completed', 'lost'] as const
export const ENQUIRY_SOURCES = ['hero', 'card', 'detail', 'floating', 'admin', 'contact'] as const
export const MEDIA_KINDS = ['image', 'video'] as const

const inList = (values: readonly string[]) => sql.raw(values.map(v => `'${v}'`).join(', '))

const createdAt = () => text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
const updatedAt = () => text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
const bool = (name: string) => integer(name, { mode: 'boolean' })
const json = <T>(name: string) => text(name, { mode: 'json' }).$type<T>()

type Faq = { q: string; a: string }

/* =============================================================================
   Admin
   ========================================================================== */

export const adminUsers = sqliteTable(
  'admin_users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    lastLoginAt: text('last_login_at'),
    createdAt: createdAt(),
    /** Revocation watermark: sessions issued before this are rejected (lib/auth.ts). */
    updatedAt: updatedAt(),
  },
  t => [uniqueIndex('admin_users_email_key').on(sql`lower(${t.email})`)],
)

/* =============================================================================
   Media. Every image reference is a media id, never a raw URL, so a Cloudinary asset can be
   deleted from exactly one place.
   ========================================================================== */

export const media = sqliteTable(
  'media',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    publicId: text('public_id').notNull(),
    kind: text('kind', { enum: MEDIA_KINDS }).notNull().default('image'),
    secureUrl: text('secure_url').notNull(),
    width: integer('width'),
    height: integer('height'),
    format: text('format'),
    bytes: integer('bytes'),
    /** Tiny base64 LQIP so a card never pops in blank on 4G. */
    placeholder: text('placeholder'),
    altText: text('alt_text'),
    folder: text('folder'),
    createdAt: createdAt(),
  },
  t => [uniqueIndex('media_public_id_key').on(t.publicId), check('media_kind_check', sql`${t.kind} IN (${inList(MEDIA_KINDS)})`)],
)

/**
 * Ordered galleries for every entity, in one table. A row here is the ONLY thing that makes an
 * image appear somewhere, which is what makes orphan detection a single query.
 */
export const mediaLinks = sqliteTable(
  'media_links',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    mediaId: integer('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    entityType: text('entity_type', { enum: ENTITY_KINDS }).notNull(),
    entityId: integer('entity_id').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  t => [
    uniqueIndex('media_links_unique').on(t.entityType, t.entityId, t.mediaId),
    index('media_links_entity_idx').on(t.entityType, t.entityId, t.sortOrder),
    check('media_links_entity_type_check', sql`${t.entityType} IN (${inList(ENTITY_KINDS)})`),
  ],
)

/** The homepage gallery: photos curated on their own, grouped into free-text albums. */
export const galleryItems = sqliteTable(
  'gallery_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    mediaId: integer('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),
    category: text('category', { enum: SERVICE_KEYS }),
    album: text('album'),
    caption: text('caption'),
    sortOrder: integer('sort_order').notNull().default(0),
    isPublished: bool('is_published').notNull().default(true),
    createdAt: createdAt(),
  },
  t => [
    index('gallery_items_sort_idx').on(t.sortOrder),
    index('gallery_items_album_idx').on(t.album, t.sortOrder),
    check('gallery_items_category_check', sql`${t.category} IS NULL OR ${t.category} IN (${inList(SERVICE_KEYS)})`),
  ],
)

/* =============================================================================
   Site-wide content
   ========================================================================== */

export const siteSettings = sqliteTable(
  'site_settings',
  {
    id: integer('id').primaryKey().default(1),
    brandName: text('brand_name').notNull().default('Ganga Vedha'),
    tagline: text('tagline'),
    whatsappNumber: text('whatsapp_number'),
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
    mapUrl: text('map_url'),
    socials: json<Record<string, string>>('socials').notNull().default({}),
    heroHeading: text('hero_heading'),
    heroSubheading: text('hero_subheading'),
    heroMediaId: integer('hero_media_id').references(() => media.id, { onDelete: 'set null' }),
    announcement: text('announcement'),
    announcementActive: bool('announcement_active').notNull().default(false),
    riverStatusLabel: text('river_status_label').notNull().default('Running today'),
    gaugeLocation: text('gauge_location').notNull().default('Shivpuri'),
    logoMediaId: integer('logo_media_id').references(() => media.id, { onDelete: 'set null' }),
    /** The Google Business listing's reviews link and its figures, copied by the owner from Google
     *  (range checked by frontend/src/lib/schemas/settings.ts). */
    googleReviewsUrl: text('google_reviews_url'),
    googleRating: real('google_rating'),
    googleReviewCount: integer('google_review_count'),
    updatedAt: updatedAt(),
  },
  t => [check('site_settings_singleton', sql`${t.id} = 1`)],
)

/** The three landing cards. Exactly three rows, seeded, never created in admin. */
export const serviceLines = sqliteTable(
  'service_lines',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    key: text('key', { enum: SERVICE_KEYS }).notNull(),
    label: text('label').notNull(),
    headline: text('headline'),
    blurb: text('blurb'),
    href: text('href').notNull(),
    cardMediaId: integer('card_media_id').references(() => media.id, { onDelete: 'set null' }),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: bool('is_active').notNull().default(true),
    updatedAt: updatedAt(),
  },
  t => [uniqueIndex('service_lines_key_key').on(t.key), check('service_lines_key_check', sql`${t.key} IN (${inList(SERVICE_KEYS)})`)],
)

/** Editable page sections, keyed (not created freely) so a section can never lose its renderer. */
export const contentBlocks = sqliteTable(
  'content_blocks',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    key: text('key').notNull(),
    title: text('title'),
    subtitle: text('subtitle'),
    body: text('body'),
    items: json<unknown[]>('items').notNull().default([]),
    isActive: bool('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    updatedAt: updatedAt(),
  },
  t => [uniqueIndex('content_blocks_key_key').on(t.key)],
)

/* =============================================================================
   Products
   ========================================================================== */

export const destinations = sqliteTable(
  'destinations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    region: text('region'),
    tagline: text('tagline'),
    intro: text('intro'),
    highlights: json<string[]>('highlights').notNull().default([]),
    bestTime: text('best_time'),
    howToReach: text('how_to_reach'),
    faqs: json<Faq[]>('faqs').notNull().default([]),
    coverMediaId: integer('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
    sortOrder: integer('sort_order').notNull().default(0),
    isPublished: bool('is_published').notNull().default(false),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [uniqueIndex('destinations_slug_key').on(t.slug), index('destinations_published_idx').on(t.isPublished, t.sortOrder)],
)

/**
 * Rafting stretches, bungee jumps and other activities share one table and one admin form.
 * `distanceKm` is null for bungee, where `heightM` carries the headline number.
 */
export const adventures = sqliteTable(
  'adventures',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    kind: text('kind', { enum: ADVENTURE_KINDS }).notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    distanceKm: real('distance_km'),
    heightM: integer('height_m'),
    putInPoint: text('put_in_point'),
    grade: text('grade', { enum: GRADE_LEVELS }),
    durationMinutes: integer('duration_minutes'),
    priceInr: integer('price_inr').notNull(),
    compareAtPriceInr: integer('compare_at_price_inr'),
    /** Placeholder until the client supplies real figures; never invented. */
    rating: real('rating'),
    reviewCount: integer('review_count'),
    badge: text('badge'),
    bestFor: text('best_for'),
    /** Operator / brand, used to group bungee jumps by operator. */
    brand: text('brand'),
    summary: text('summary'),
    description: text('description'),
    inclusions: json<string[]>('inclusions').notNull().default([]),
    exclusions: json<string[]>('exclusions').notNull().default([]),
    whatToBring: json<string[]>('what_to_bring').notNull().default([]),
    faqs: json<Faq[]>('faqs').notNull().default([]),
    rapids: json<string[]>('rapids').notNull().default([]),
    meetingPoint: text('meeting_point'),
    minAge: integer('min_age'),
    minWeightKg: integer('min_weight_kg'),
    maxWeightKg: integer('max_weight_kg'),
    coverMediaId: integer('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
    sortOrder: integer('sort_order').notNull().default(0),
    isPublished: bool('is_published').notNull().default(false),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [
    uniqueIndex('adventures_slug_key').on(t.slug),
    index('adventures_kind_idx').on(t.kind, t.isPublished, t.sortOrder),
    check('adventures_kind_check', sql`${t.kind} IN (${inList(ADVENTURE_KINDS)})`),
    check('adventures_grade_check', sql`${t.grade} IS NULL OR ${t.grade} IN (${inList(GRADE_LEVELS)})`),
    check('adventures_price_positive', sql`${t.priceInr} >= 0`),
    check('adventures_compare_price_higher', sql`${t.compareAtPriceInr} IS NULL OR ${t.compareAtPriceInr} > ${t.priceInr}`),
    check('adventures_rating_range', sql`${t.rating} IS NULL OR (${t.rating} >= 0 AND ${t.rating} <= 5)`),
    check('adventures_rafting_has_distance', sql`${t.kind} <> 'rafting' OR ${t.distanceKm} IS NOT NULL`),
    check('adventures_weight_range', sql`${t.minWeightKg} IS NULL OR ${t.maxWeightKg} IS NULL OR ${t.maxWeightKg} >= ${t.minWeightKg}`),
  ],
)

export const hotels = sqliteTable(
  'hotels',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    tagline: text('tagline'),
    description: text('description'),
    address: text('address'),
    locality: text('locality'),
    lat: real('lat'),
    lng: real('lng'),
    mapUrl: text('map_url'),
    destinationId: integer('destination_id').references(() => destinations.id, { onDelete: 'set null' }),
    starRating: integer('star_rating'),
    pricePerNightInr: integer('price_per_night_inr').notNull(),
    compareAtPriceInr: integer('compare_at_price_inr'),
    rating: real('rating'),
    reviewCount: integer('review_count'),
    badge: text('badge'),
    checkInTime: text('check_in_time'),
    checkOutTime: text('check_out_time'),
    amenities: json<string[]>('amenities').notNull().default([]),
    houseRules: json<string[]>('house_rules').notNull().default([]),
    faqs: json<Faq[]>('faqs').notNull().default([]),
    coverMediaId: integer('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
    sortOrder: integer('sort_order').notNull().default(0),
    isPublished: bool('is_published').notNull().default(false),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [
    uniqueIndex('hotels_slug_key').on(t.slug),
    index('hotels_published_idx').on(t.isPublished, t.sortOrder),
    check('hotels_price_positive', sql`${t.pricePerNightInr} >= 0`),
    check('hotels_star_range', sql`${t.starRating} IS NULL OR (${t.starRating} BETWEEN 1 AND 5)`),
    check('hotels_rating_range', sql`${t.rating} IS NULL OR (${t.rating} >= 0 AND ${t.rating} <= 5)`),
  ],
)

export const hotelRooms = sqliteTable(
  'hotel_rooms',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    hotelId: integer('hotel_id')
      .notNull()
      .references(() => hotels.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    occupancy: integer('occupancy').notNull().default(2),
    bedType: text('bed_type'),
    pricePerNightInr: integer('price_per_night_inr').notNull(),
    inclusions: json<string[]>('inclusions').notNull().default([]),
    mediaId: integer('media_id').references(() => media.id, { onDelete: 'set null' }),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  t => [
    index('hotel_rooms_hotel_idx').on(t.hotelId, t.sortOrder),
    check('hotel_rooms_price_positive', sql`${t.pricePerNightInr} >= 0`),
    check('hotel_rooms_occupancy_positive', sql`${t.occupancy} > 0`),
  ],
)

/** Holiday packages. `priceInr` is the "starting from" figure; `itinerary` is day-by-day. */
export const packages = sqliteTable(
  'packages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    category: text('category'),
    destinationId: integer('destination_id').references(() => destinations.id, { onDelete: 'set null' }),
    durationLabel: text('duration_label'),
    nights: integer('nights'),
    routeLabel: text('route_label'),
    priceInr: integer('price_inr').notNull(),
    compareAtPriceInr: integer('compare_at_price_inr'),
    priceNote: text('price_note'),
    rating: real('rating'),
    reviewCount: integer('review_count'),
    badge: text('badge'),
    summary: text('summary'),
    description: text('description'),
    itinerary: json<{ title: string; detail: string }[]>('itinerary').notNull().default([]),
    inclusions: json<string[]>('inclusions').notNull().default([]),
    exclusions: json<string[]>('exclusions').notNull().default([]),
    accommodationNote: text('accommodation_note'),
    transportNote: text('transport_note'),
    mealsNote: text('meals_note'),
    terms: json<string[]>('terms').notNull().default([]),
    faqs: json<Faq[]>('faqs').notNull().default([]),
    coverMediaId: integer('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
    sortOrder: integer('sort_order').notNull().default(0),
    isPublished: bool('is_published').notNull().default(false),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [
    uniqueIndex('packages_slug_key').on(t.slug),
    index('packages_published_idx').on(t.isPublished, t.sortOrder),
    check('packages_price_positive', sql`${t.priceInr} >= 0`),
    check('packages_compare_price_higher', sql`${t.compareAtPriceInr} IS NULL OR ${t.compareAtPriceInr} > ${t.priceInr}`),
    check('packages_rating_range', sql`${t.rating} IS NULL OR (${t.rating} >= 0 AND ${t.rating} <= 5)`),
  ],
)

/** Car and bike rental. A car is quote-only (`perDayInr` null); a bike carries a per-day rate. */
export const rentals = sqliteTable(
  'rentals',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    kind: text('kind', { enum: RENTAL_KINDS }).notNull(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    perDayInr: integer('per_day_inr'),
    quoteOnly: bool('quote_only').notNull().default(false),
    depositInr: integer('deposit_inr'),
    seats: integer('seats'),
    transmission: text('transmission'),
    fuelNote: text('fuel_note'),
    summary: text('summary'),
    description: text('description'),
    includes: json<string[]>('includes').notNull().default([]),
    documentsRequired: json<string[]>('documents_required').notNull().default([]),
    terms: json<string[]>('terms').notNull().default([]),
    pickupNote: text('pickup_note'),
    faqs: json<Faq[]>('faqs').notNull().default([]),
    coverMediaId: integer('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
    sortOrder: integer('sort_order').notNull().default(0),
    isPublished: bool('is_published').notNull().default(false),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [
    uniqueIndex('rentals_slug_key').on(t.slug),
    index('rentals_kind_idx').on(t.kind, t.isPublished, t.sortOrder),
    check('rentals_kind_check', sql`${t.kind} IN (${inList(RENTAL_KINDS)})`),
    check('rentals_per_day_positive', sql`${t.perDayInr} IS NULL OR ${t.perDayInr} >= 0`),
    check('rentals_quote_or_price', sql`${t.quoteOnly} = 1 OR ${t.perDayInr} IS NOT NULL`),
  ],
)

/* =============================================================================
   Closures: the single source of truth for whether anything can be booked. An entity is closed
   iff an active closure resolves to it, most specific scope winning: global > service > entity.
   ========================================================================== */

export const closures = sqliteTable(
  'closures',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    scope: text('scope', { enum: CLOSURE_SCOPES }).notNull(),
    serviceKey: text('service_key', { enum: SERVICE_KEYS }),
    entityType: text('entity_type', { enum: ENTITY_KINDS }),
    entityId: integer('entity_id'),
    isActive: bool('is_active').notNull().default(false),
    icon: text('icon', { enum: CLOSURE_ICONS }).notNull().default('rain'),
    title: text('title').notNull(),
    body: text('body').notNull(),
    footnote: text('footnote'),
    ctaLabel: text('cta_label').notNull().default('Got it'),
    startsAt: text('starts_at'),
    endsAt: text('ends_at'),
    /** Bumped whenever the message changes, so editing the copy brings a dismissed notice back. */
    version: integer('version').notNull().default(1),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [
    index('closures_active_idx').on(t.isActive, t.scope),
    uniqueIndex('closures_global_key').on(t.scope).where(sql`${t.scope} = 'global'`),
    uniqueIndex('closures_service_key').on(t.serviceKey).where(sql`${t.scope} = 'service'`),
    uniqueIndex('closures_entity_key').on(t.entityType, t.entityId).where(sql`${t.scope} = 'entity'`),
    check('closures_scope_check', sql`${t.scope} IN (${inList(CLOSURE_SCOPES)})`),
    check('closures_icon_check', sql`${t.icon} IN (${inList(CLOSURE_ICONS)})`),
    check(
      'closures_scope_shape',
      sql`(${t.scope} = 'global' AND ${t.serviceKey} IS NULL AND ${t.entityType} IS NULL AND ${t.entityId} IS NULL)
       OR (${t.scope} = 'service' AND ${t.serviceKey} IS NOT NULL AND ${t.entityType} IS NULL AND ${t.entityId} IS NULL)
       OR (${t.scope} = 'entity' AND ${t.serviceKey} IS NULL AND ${t.entityType} IS NOT NULL AND ${t.entityId} IS NOT NULL)`,
    ),
    check('closures_window_ordered', sql`${t.startsAt} IS NULL OR ${t.endsAt} IS NULL OR ${t.endsAt} > ${t.startsAt}`),
  ],
)

/* =============================================================================
   Enquiries: captured leads, not paid orders. Product FKs are SET NULL, never CASCADE; the
   snapshot columns keep an enquiry readable after its product is gone or repriced.
   ========================================================================== */

export const enquiries = sqliteTable(
  'enquiries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    refCode: text('ref_code').notNull(),
    productKind: text('product_kind', { enum: SERVICE_KEYS }).notNull(),
    adventureId: integer('adventure_id').references(() => adventures.id, { onDelete: 'set null' }),
    hotelId: integer('hotel_id').references(() => hotels.id, { onDelete: 'set null' }),
    packageId: integer('package_id').references(() => packages.id, { onDelete: 'set null' }),
    rentalId: integer('rental_id').references(() => rentals.id, { onDelete: 'set null' }),
    productNameSnapshot: text('product_name_snapshot').notNull(),
    productPriceSnapshotInr: integer('product_price_snapshot_inr'),
    subject: text('subject'),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    state: text('state'),
    /** YYYY-MM-DD. */
    travelDate: text('travel_date'),
    groupSize: integer('group_size'),
    message: text('message'),
    source: text('source', { enum: ENQUIRY_SOURCES }).notNull().default('card'),
    status: text('status', { enum: ENQUIRY_STATUSES }).notNull().default('new'),
    adminNote: text('admin_note'),
    utm: json<Record<string, string>>('utm').notNull().default({}),
    ipHash: text('ip_hash'),
    userAgent: text('user_agent'),
    contactedAt: text('contacted_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [
    uniqueIndex('enquiries_ref_code_key').on(t.refCode),
    index('enquiries_status_idx').on(t.status, t.createdAt),
    index('enquiries_created_idx').on(t.createdAt),
    index('enquiries_rate_limit_idx').on(t.ipHash, t.createdAt),
    check('enquiries_product_kind_check', sql`${t.productKind} IN (${inList(SERVICE_KEYS)})`),
    check('enquiries_source_check', sql`${t.source} IN (${inList(ENQUIRY_SOURCES)})`),
    check('enquiries_status_check', sql`${t.status} IN (${inList(ENQUIRY_STATUSES)})`),
    check('enquiries_group_size', sql`${t.groupSize} IS NULL OR ${t.groupSize} > 0`),
    check('enquiries_phone_shape', sql`${t.phone} GLOB '[6-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'`),
    check(
      'enquiries_one_product',
      sql`(${t.adventureId} IS NOT NULL) + (${t.hotelId} IS NOT NULL) + (${t.packageId} IS NOT NULL) + (${t.rentalId} IS NOT NULL) <= 1`,
    ),
  ],
)

/* =============================================================================
   Social proof
   ========================================================================== */

export const reviews = sqliteTable(
  'reviews',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    authorName: text('author_name').notNull(),
    rating: integer('rating').notNull(),
    body: text('body').notNull(),
    source: text('source').notNull().default('manual'),
    tripLabel: text('trip_label'),
    avatarMediaId: integer('avatar_media_id').references(() => media.id, { onDelete: 'set null' }),
    isPublished: bool('is_published').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
  },
  t => [index('reviews_published_idx').on(t.isPublished, t.sortOrder), check('reviews_rating_range', sql`${t.rating} BETWEEN 1 AND 5`)],
)

/** Owner-managed promo cards shown in a strip under the hero. */
export const promotions = sqliteTable(
  'promotions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    body: text('body'),
    ctaLabel: text('cta_label'),
    ctaHref: text('cta_href'),
    mediaId: integer('media_id').references(() => media.id, { onDelete: 'set null' }),
    isActive: bool('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  t => [index('promotions_active_idx').on(t.isActive, t.sortOrder)],
)

/* =============================================================================
   Audit and rate limits
   ========================================================================== */

export const auditLog = sqliteTable(
  'audit_log',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    adminUserId: integer('admin_user_id').references(() => adminUsers.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id'),
    label: text('label'),
    diff: json<Record<string, { from: unknown; to: unknown }>>('diff'),
    createdAt: createdAt(),
  },
  t => [index('audit_log_created_idx').on(t.createdAt)],
)

/** Fixed-window counters for login and enquiry rate limits (lib/ratelimit.ts). */
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  windowStart: integer('window_start').notNull(),
  count: integer('count').notNull(),
})

/* =============================================================================
   Relations: enables db.query.hotels.findMany({ with: { rooms: true } })
   ========================================================================== */

export const hotelsRelations = relations(hotels, ({ many, one }) => ({
  rooms: many(hotelRooms),
  destination: one(destinations, { fields: [hotels.destinationId], references: [destinations.id] }),
}))

export const hotelRoomsRelations = relations(hotelRooms, ({ one }) => ({
  hotel: one(hotels, { fields: [hotelRooms.hotelId], references: [hotels.id] }),
}))

export const destinationsRelations = relations(destinations, ({ many }) => ({
  hotels: many(hotels),
  packages: many(packages),
}))

export const packagesRelations = relations(packages, ({ one }) => ({
  destination: one(destinations, { fields: [packages.destinationId], references: [destinations.id] }),
}))

/* =============================================================================
   Row types. The frontend imports these with `import type` (never runtime code): they are
   exactly what the admin API returns as JSON.
   ========================================================================== */

export type Media = typeof media.$inferSelect
export type GalleryItem = typeof galleryItems.$inferSelect
export type Adventure = typeof adventures.$inferSelect
export type Hotel = typeof hotels.$inferSelect
export type HotelRoom = typeof hotelRooms.$inferSelect
export type Destination = typeof destinations.$inferSelect
export type Package = typeof packages.$inferSelect
export type Rental = typeof rentals.$inferSelect
export type Closure = typeof closures.$inferSelect
export type Enquiry = typeof enquiries.$inferSelect
export type Review = typeof reviews.$inferSelect
export type Promotion = typeof promotions.$inferSelect
export type ServiceLine = typeof serviceLines.$inferSelect
export type SiteSettings = typeof siteSettings.$inferSelect
export type ContentBlock = typeof contentBlocks.$inferSelect
export type AdminUser = typeof adminUsers.$inferSelect
