import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "../db";
import {
  adventures as adventuresTable,
  closures as closuresTable,
  contentBlocks as contentBlocksTable,
  destinations as destinationsTable,
  galleryItems as galleryItemsTable,
  hotelRooms as hotelRoomsTable,
  hotels as hotelsTable,
  media as mediaTable,
  mediaLinks as mediaLinksTable,
  packages as packagesTable,
  promotions as promotionsTable,
  rentals as rentalsTable,
  reviews as reviewsTable,
  siteSettings as siteSettingsTable,
} from "../schema";
import { HERO_ROOMS_DEFAULT, HERO_ROOMS_KEY, type HeroRoomItem } from "../../../frontend/src/lib/hero-rooms";
import type {
  Adventure,
  AdventureKind,
  Closure,
  ContentBlock,
  Destination,
  GalleryItem,
  Hotel,
  MediaSource,
  Package,
  Promotion,
  Rental,
  Review,
  SiteSettings,
  WhyUsItem,
} from "../../../frontend/src/lib/content-types";

/**
 * Public reads: published rows only, mapped to the shapes in frontend/src/lib/content-types.ts.
 * Served by routes/public.ts with short HTTP cache lifetimes; the frontend's lib/content.ts calls
 * these through the /api proxy and falls back to its static seed when no API is configured.
 */

function toMediaSource(row: typeof mediaTable.$inferSelect | undefined): MediaSource | null {
  if (!row) return null;
  return {
    src: row.secureUrl,
    alt: row.altText ?? "",
    width: row.width,
    height: row.height,
    placeholder: row.placeholder,
  };
}

/**
 * Batches every `coverMediaId` in a result set into one query instead of one
 * per row — the card grids on `/rafting` and `/hotels` would otherwise fire
 * a media lookup per item.
 */
async function getMediaByIds(
  ids: (number | null)[],
): Promise<Map<number, typeof mediaTable.$inferSelect>> {
  const uniqueIds = [...new Set(ids.filter((id): id is number => id !== null))];
  if (uniqueIds.length === 0) return new Map();
  const rows = await getDb().select().from(mediaTable).where(inArray(mediaTable.id, uniqueIds));
  return new Map(rows.map((r) => [r.id, r]));
}

/** The ordered gallery for one entity — currently only hotels expose one. */
async function getGallery(entityType: "hotel" | "adventure", entityId: number): Promise<MediaSource[]> {
  const rows = await getDb()
    .select({ media: mediaTable })
    .from(mediaLinksTable)
    .innerJoin(mediaTable, eq(mediaLinksTable.mediaId, mediaTable.id))
    .where(and(eq(mediaLinksTable.entityType, entityType), eq(mediaLinksTable.entityId, entityId)))
    .orderBy(mediaLinksTable.sortOrder);
  return rows.map((r) => toMediaSource(r.media)).filter((m): m is MediaSource => m !== null);
}

function mapAdventure(
  row: typeof adventuresTable.$inferSelect,
  coverMediaRow?: typeof mediaTable.$inferSelect,
): Adventure {
  return {
    id: row.id,
    kind: row.kind,
    slug: row.slug,
    name: row.name,
    distanceKm: row.distanceKm,
    heightM: row.heightM,
    putInPoint: row.putInPoint,
    grade: row.grade,
    durationMinutes: row.durationMinutes ?? 0,
    priceInr: row.priceInr,
    compareAtPriceInr: row.compareAtPriceInr,
    rating: row.rating,
    reviewCount: row.reviewCount,
    badge: row.badge,
    bestFor: row.bestFor,
    brand: row.brand,
    summary: row.summary ?? "",
    description: row.description ?? "",
    inclusions: row.inclusions,
    exclusions: row.exclusions,
    whatToBring: row.whatToBring,
    faqs: row.faqs,
    meetingPoint: row.meetingPoint ?? "",
    minAge: row.minAge,
    minWeightKg: row.minWeightKg,
    maxWeightKg: row.maxWeightKg,
    rapids: row.rapids,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    coverMedia: toMediaSource(coverMediaRow),
  };
}

function mapHotel(
  row: typeof hotelsTable.$inferSelect & {
    rooms: (typeof hotelRoomsTable.$inferSelect)[];
  },
  coverMediaRow?: typeof mediaTable.$inferSelect,
  gallery: MediaSource[] = [],
  roomMediaMap: Map<number, typeof mediaTable.$inferSelect> = new Map(),
  destinationSlug: string | null = null,
): Hotel {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    address: row.address ?? "",
    locality: row.locality ?? "",
    destinationSlug,
    mapUrl: row.mapUrl,
    starRating: row.starRating,
    pricePerNightInr: row.pricePerNightInr,
    compareAtPriceInr: row.compareAtPriceInr,
    rating: row.rating,
    reviewCount: row.reviewCount,
    badge: row.badge,
    checkInTime: row.checkInTime ?? "",
    checkOutTime: row.checkOutTime ?? "",
    amenities: row.amenities,
    houseRules: row.houseRules,
    faqs: row.faqs,
    rooms: row.rooms
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((r) => ({
        id: r.id,
        name: r.name,
        occupancy: r.occupancy,
        bedType: r.bedType ?? "",
        pricePerNightInr: r.pricePerNightInr,
        inclusions: r.inclusions,
        coverMedia: toMediaSource(r.mediaId ? roomMediaMap.get(r.mediaId) : undefined),
      })),
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    coverMedia: toMediaSource(coverMediaRow),
    gallery,
  };
}

function mapReview(row: typeof reviewsTable.$inferSelect): Review {
  return {
    id: row.id,
    authorName: row.authorName,
    rating: row.rating,
    body: row.body,
    tripLabel: row.tripLabel,
  };
}

function mapGalleryItem(
  row: typeof galleryItemsTable.$inferSelect,
  mediaRow: typeof mediaTable.$inferSelect,
): GalleryItem {
  return {
    id: row.id,
    // The column is the wide service_key enum; a gallery category is only ever
    // one of the three core services in the app.
    category: row.category as GalleryItem["category"],
    album: row.album,
    caption: row.caption,
    // Never null in practice — the FK is NOT NULL and the join is inner —
    // but `toMediaSource` still takes `| undefined` from its other callers,
    // so this satisfies that signature without a second, looser type here.
    media: toMediaSource(mediaRow) as MediaSource,
  };
}

function mapClosure(row: typeof closuresTable.$inferSelect): Closure {
  return {
    id: row.id,
    scope: row.scope,
    // Closures are only ever scoped to one of the three core services.
    serviceKey: row.serviceKey as Closure["serviceKey"],
    entityType: row.entityType as Closure["entityType"],
    entityId: row.entityId,
    isActive: row.isActive,
    icon: row.icon,
    title: row.title,
    body: row.body,
    footnote: row.footnote,
    ctaLabel: row.ctaLabel,
    version: row.version,
  };
}

function mapSettings(
  row: typeof siteSettingsTable.$inferSelect,
  heroMediaRow?: typeof mediaTable.$inferSelect,
): SiteSettings {
  return {
    brandName: row.brandName,
    tagline: row.tagline ?? "",
    whatsappNumber: row.whatsappNumber ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    mapUrl: row.mapUrl ?? "",
    heroHeading: row.heroHeading ?? "",
    heroSubheading: row.heroSubheading ?? "",
    heroMedia: toMediaSource(heroMediaRow),
    announcement: row.announcement,
    announcementActive: row.announcementActive,
    riverStatusLabel: row.riverStatusLabel,
    gaugeLocation: row.gaugeLocation,
  };
}

function mapPromotion(
  row: typeof promotionsTable.$inferSelect,
  mediaRow?: typeof mediaTable.$inferSelect,
): Promotion {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    media: toMediaSource(mediaRow),
  };
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const [row] = await getDb()
    .select()
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.id, 1))
    .limit(1);
  if (!row) return null;
  const heroMap = await getMediaByIds([row.heroMediaId]);
  return mapSettings(row, row.heroMediaId ? heroMap.get(row.heroMediaId) : undefined);
}

export async function getPromotions(): Promise<Promotion[]> {
  const rows = await getDb()
    .select()
    .from(promotionsTable)
    .where(eq(promotionsTable.isActive, true))
    .orderBy(promotionsTable.sortOrder);
  const mediaMap = await getMediaByIds(rows.map((r) => r.mediaId));
  return rows.map((r) => mapPromotion(r, r.mediaId ? mediaMap.get(r.mediaId) : undefined));
}

export async function getAdventures(kind?: AdventureKind): Promise<Adventure[]> {
  const rows = await getDb()
    .select()
    .from(adventuresTable)
    .where(
      kind
        ? and(eq(adventuresTable.isPublished, true), eq(adventuresTable.kind, kind))
        : eq(adventuresTable.isPublished, true),
    )
    .orderBy(adventuresTable.sortOrder);
  const mediaMap = await getMediaByIds(rows.map((r) => r.coverMediaId));
  return rows.map((r) => mapAdventure(r, r.coverMediaId ? mediaMap.get(r.coverMediaId) : undefined));
}




export async function getAdventure(slug: string): Promise<Adventure | null> {
  const [row] = await getDb()
    .select()
    .from(adventuresTable)
    .where(
      and(eq(adventuresTable.slug, slug), eq(adventuresTable.isPublished, true)),
    )
    .limit(1);
  if (!row) return null;
  const mediaMap = await getMediaByIds([row.coverMediaId]);
  return mapAdventure(row, row.coverMediaId ? mediaMap.get(row.coverMediaId) : undefined);
}

export async function getHotels(): Promise<Hotel[]> {
  const rows = await getDb().query.hotels.findMany({
    where: eq(hotelsTable.isPublished, true),
    orderBy: hotelsTable.sortOrder,
    with: { rooms: true },
  });
  const [mediaMap, roomMediaMap, destSlugs] = await Promise.all([
    getMediaByIds(rows.map((r) => r.coverMediaId)),
    getMediaByIds(rows.flatMap((r) => r.rooms.map((room) => room.mediaId))),
    getDestinationSlugsByIds(rows.map((r) => r.destinationId)),
  ]);
  return rows.map((r) =>
    mapHotel(
      r,
      r.coverMediaId ? mediaMap.get(r.coverMediaId) : undefined,
      [],
      roomMediaMap,
      r.destinationId ? (destSlugs.get(r.destinationId) ?? null) : null,
    ),
  );
}

export async function getHotel(slug: string): Promise<Hotel | null> {
  const row = await getDb().query.hotels.findFirst({
    where: and(eq(hotelsTable.slug, slug), eq(hotelsTable.isPublished, true)),
    with: { rooms: true },
  });
  if (!row) return null;
  const [mediaMap, gallery, roomMediaMap, destSlugs] = await Promise.all([
    getMediaByIds([row.coverMediaId]),
    getGallery("hotel", row.id),
    getMediaByIds(row.rooms.map((room) => room.mediaId)),
    getDestinationSlugsByIds([row.destinationId]),
  ]);
  return mapHotel(
    row,
    row.coverMediaId ? mediaMap.get(row.coverMediaId) : undefined,
    gallery,
    roomMediaMap,
    row.destinationId ? (destSlugs.get(row.destinationId) ?? null) : null,
  );
}

export async function getReviews(): Promise<Review[]> {
  const rows = await getDb()
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.isPublished, true))
    .orderBy(reviewsTable.sortOrder);
  return rows.map(mapReview);
}

/** All published gallery photos, newest-curated-first order. Filter by category client-side — the whole set is small enough to ship in one request and switch instantly. */
export async function getGalleryItems(): Promise<GalleryItem[]> {
  const rows = await getDb()
    .select({ item: galleryItemsTable, media: mediaTable })
    .from(galleryItemsTable)
    .innerJoin(mediaTable, eq(galleryItemsTable.mediaId, mediaTable.id))
    .where(eq(galleryItemsTable.isPublished, true))
    .orderBy(galleryItemsTable.sortOrder);
  return rows.map((r) => mapGalleryItem(r.item, r.media));
}

export async function getClosures(): Promise<Closure[]> {
  const rows = await getDb()
    .select()
    .from(closuresTable)
    .where(eq(closuresTable.isActive, true));
  return rows.map(mapClosure);
}

/**
 * A named, admin-editable page section (the "Why book with us" grid and
 * anything like it later). `key` is the renderer's contract with the row —
 * a section can be re-copied and reordered from the admin panel, but it can
 * never lose the component that knows how to draw it.
 */
export async function getContentBlock(key: string): Promise<ContentBlock | null> {
  const [row] = await getDb()
    .select()
    .from(contentBlocksTable)
    .where(and(eq(contentBlocksTable.key, key), eq(contentBlocksTable.isActive, true)))
    .limit(1);
  if (!row) return null;
  return {
    key: row.key,
    title: row.title,
    subtitle: row.subtitle,
    body: row.body,
    items: row.items as WhyUsItem[],
    isActive: row.isActive,
  };
}

/** A hero room card ready to render: the stored item with its photo resolved. */
export type HeroRoom = Omit<HeroRoomItem, "mediaId" | "photo"> & { photo: MediaSource | null };

function resolveHeroRooms(
  items: HeroRoomItem[],
  mediaById: Map<number, typeof mediaTable.$inferSelect>,
): HeroRoom[] {
  return items.map(({ mediaId, photo, ...room }) => ({
    ...room,
    // An uploaded photo that has since been deleted falls back to the poster
    // crop, then to the card's plain stand-in, never to a broken image.
    photo:
      toMediaSource(mediaId === null ? undefined : mediaById.get(mediaId)) ??
      (photo ? { src: photo, alt: "" } : null),
  }));
}

export async function getHeroRooms(): Promise<HeroRoom[]> {
  const [row] = await getDb()
    .select({ items: contentBlocksTable.items })
    .from(contentBlocksTable)
    .where(and(eq(contentBlocksTable.key, HERO_ROOMS_KEY), eq(contentBlocksTable.isActive, true)))
    .limit(1);
  const items = row ? (row.items as HeroRoomItem[]) : HERO_ROOMS_DEFAULT;
  return resolveHeroRooms(items, await getMediaByIds(items.map((r) => r.mediaId)));
}

/* =============================================================================
   Destinations, packages, rentals — the blueprint's added product lines.
   ========================================================================== */

function mapDestination(
  row: typeof destinationsTable.$inferSelect,
  coverMediaRow?: typeof mediaTable.$inferSelect,
): Destination {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    region: row.region,
    tagline: row.tagline ?? "",
    intro: row.intro ?? "",
    highlights: row.highlights,
    bestTime: row.bestTime,
    howToReach: row.howToReach,
    faqs: row.faqs,
    coverMedia: toMediaSource(coverMediaRow),
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
  };
}

function mapPackage(
  row: typeof packagesTable.$inferSelect,
  destinationSlug: string | null,
  coverMediaRow?: typeof mediaTable.$inferSelect,
): Package {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    destinationSlug,
    durationLabel: row.durationLabel,
    nights: row.nights,
    routeLabel: row.routeLabel,
    priceInr: row.priceInr,
    compareAtPriceInr: row.compareAtPriceInr,
    priceNote: row.priceNote,
    rating: row.rating,
    reviewCount: row.reviewCount,
    badge: row.badge,
    summary: row.summary ?? "",
    description: row.description ?? "",
    itinerary: row.itinerary,
    inclusions: row.inclusions,
    exclusions: row.exclusions,
    accommodationNote: row.accommodationNote,
    transportNote: row.transportNote,
    mealsNote: row.mealsNote,
    terms: row.terms,
    faqs: row.faqs,
    coverMedia: toMediaSource(coverMediaRow),
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
  };
}

function mapRental(
  row: typeof rentalsTable.$inferSelect,
  coverMediaRow?: typeof mediaTable.$inferSelect,
): Rental {
  return {
    id: row.id,
    kind: row.kind,
    slug: row.slug,
    name: row.name,
    perDayInr: row.perDayInr,
    quoteOnly: row.quoteOnly,
    depositInr: row.depositInr,
    seats: row.seats,
    transmission: row.transmission,
    fuelNote: row.fuelNote,
    summary: row.summary ?? "",
    description: row.description ?? "",
    includes: row.includes,
    documentsRequired: row.documentsRequired,
    terms: row.terms,
    pickupNote: row.pickupNote,
    faqs: row.faqs,
    coverMedia: toMediaSource(coverMediaRow),
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
  };
}

/** slug lookup for a set of destination ids — batched like the media map. */
async function getDestinationSlugsByIds(ids: (number | null)[]): Promise<Map<number, string>> {
  const uniqueIds = [...new Set(ids.filter((id): id is number => id !== null))];
  if (uniqueIds.length === 0) return new Map();
  const rows = await getDb()
    .select({ id: destinationsTable.id, slug: destinationsTable.slug })
    .from(destinationsTable)
    .where(inArray(destinationsTable.id, uniqueIds));
  return new Map(rows.map((r) => [r.id, r.slug]));
}

export async function getDestinations(): Promise<Destination[]> {
  const rows = await getDb()
    .select()
    .from(destinationsTable)
    .where(eq(destinationsTable.isPublished, true))
    .orderBy(destinationsTable.sortOrder);
  const mediaMap = await getMediaByIds(rows.map((r) => r.coverMediaId));
  return rows.map((r) =>
    mapDestination(r, r.coverMediaId ? mediaMap.get(r.coverMediaId) : undefined),
  );
}

export async function getDestination(slug: string): Promise<Destination | null> {
  const [row] = await getDb()
    .select()
    .from(destinationsTable)
    .where(and(eq(destinationsTable.slug, slug), eq(destinationsTable.isPublished, true)))
    .limit(1);
  if (!row) return null;
  const mediaMap = await getMediaByIds([row.coverMediaId]);
  return mapDestination(row, row.coverMediaId ? mediaMap.get(row.coverMediaId) : undefined);
}

export async function getPackages(): Promise<Package[]> {
  const rows = await getDb()
    .select()
    .from(packagesTable)
    .where(eq(packagesTable.isPublished, true))
    .orderBy(packagesTable.sortOrder);
  const [mediaMap, destSlugs] = await Promise.all([
    getMediaByIds(rows.map((r) => r.coverMediaId)),
    getDestinationSlugsByIds(rows.map((r) => r.destinationId)),
  ]);
  return rows.map((r) =>
    mapPackage(
      r,
      r.destinationId ? (destSlugs.get(r.destinationId) ?? null) : null,
      r.coverMediaId ? mediaMap.get(r.coverMediaId) : undefined,
    ),
  );
}

export async function getPackage(slug: string): Promise<Package | null> {
  const [row] = await getDb()
    .select()
    .from(packagesTable)
    .where(and(eq(packagesTable.slug, slug), eq(packagesTable.isPublished, true)))
    .limit(1);
  if (!row) return null;
  const [mediaMap, destSlugs] = await Promise.all([
    getMediaByIds([row.coverMediaId]),
    getDestinationSlugsByIds([row.destinationId]),
  ]);
  return mapPackage(
    row,
    row.destinationId ? (destSlugs.get(row.destinationId) ?? null) : null,
    row.coverMediaId ? mediaMap.get(row.coverMediaId) : undefined,
  );
}


export async function getRentals(): Promise<Rental[]> {
  const rows = await getDb()
    .select()
    .from(rentalsTable)
    .where(eq(rentalsTable.isPublished, true))
    .orderBy(rentalsTable.sortOrder);
  const mediaMap = await getMediaByIds(rows.map((r) => r.coverMediaId));
  return rows.map((r) => mapRental(r, r.coverMediaId ? mediaMap.get(r.coverMediaId) : undefined));
}



export async function getRental(slug: string): Promise<Rental | null> {
  const [row] = await getDb()
    .select()
    .from(rentalsTable)
    .where(and(eq(rentalsTable.slug, slug), eq(rentalsTable.isPublished, true)))
    .limit(1);
  if (!row) return null;
  const mediaMap = await getMediaByIds([row.coverMediaId]);
  return mapRental(row, row.coverMediaId ? mediaMap.get(row.coverMediaId) : undefined);
}

