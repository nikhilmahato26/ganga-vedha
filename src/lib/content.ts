import "server-only";
import { unstable_cache as cache } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  adventures as adventuresTable,
  closures as closuresTable,
  contentBlocks as contentBlocksTable,
  destinations as destinationsTable,
  galleryItems as galleryItemsTable,
  hotels as hotelsTable,
  media as mediaTable,
  mediaLinks as mediaLinksTable,
  packages as packagesTable,
  rentals as rentalsTable,
  reviews as reviewsTable,
  siteSettings as siteSettingsTable,
} from "@/db/schema";
import { hasDatabase } from "@/lib/env";
import * as seed from "./content.seed";
import type { MediaSource } from "@/components/ui/media";

export type {
  Adventure,
  AdventureKind,
  Closure,
  Destination,
  EnquiryKind,
  GalleryItem,
  Grade,
  Hotel,
  HotelRoom,
  Package,
  PackageItinerary,
  Rental,
  Review,
  ServiceKey,
  SiteSettings,
} from "./content.seed";
import type {
  Adventure,
  AdventureKind,
  Closure,
  Destination,
  GalleryItem,
  Hotel,
  Package,
  Rental,
  Review,
  SiteSettings,
} from "./content.seed";

/**
 * The content layer every page imports.
 *
 * Queries Neon when DATABASE_URL is configured; falls back to the static
 * seed in `content.seed.ts` otherwise, so the site stays browsable without a
 * database (a fresh clone, CI, a contributor without Neon access).
 *
 * Every read is `unstable_cache`-tagged AND carries a time-based `revalidate`
 * backstop (30s for closures — the monsoon switch — up to 300s for low-churn
 * content). The backstop exists so content edited directly in Neon, or a
 * cache entry from a stale deploy, cannot stay wrong indefinitely; it is not
 * the primary invalidation path. Phase 2's admin mutations call
 * `revalidateTag` with these same tags on every write, which is what makes an
 * edit through the admin panel show up on the live site within one request
 * instead of waiting up to a minute.
 */

const TAGS = {
  settings: "site-settings",
  adventures: "adventures",
  hotels: "hotels",
  reviews: "reviews",
  closures: "closures",
  content: "content-blocks",
  gallery: "gallery",
  destinations: "destinations",
  packages: "packages",
  rentals: "rentals",
} as const;

export type WhyUsItem = { icon: string; title: string; body: string };
export type ContentBlock = {
  key: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  items: WhyUsItem[];
  isActive: boolean;
};

/** DB numeric columns round-trip as strings — Postgres numeric outranges JS number precision. */
function num(v: string | null): number | null {
  return v === null ? null : Number(v);
}

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
    distanceKm: num(row.distanceKm),
    heightM: row.heightM,
    putInPoint: row.putInPoint,
    grade: row.grade,
    durationMinutes: row.durationMinutes ?? 0,
    priceInr: row.priceInr,
    compareAtPriceInr: row.compareAtPriceInr,
    rating: num(row.rating),
    reviewCount: row.reviewCount,
    badge: row.badge,
    bestFor: row.bestFor,
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
    rooms: (typeof import("@/db/schema").hotelRooms.$inferSelect)[];
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
    rating: num(row.rating),
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

function mapSettings(row: typeof siteSettingsTable.$inferSelect): SiteSettings {
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
    announcement: row.announcement,
    announcementActive: row.announcementActive,
    riverStatusLabel: row.riverStatusLabel,
    gaugeLocation: row.gaugeLocation,
  };
}

/** True while the site is running on seed content instead of the database. */
export function isSeedContent(): boolean {
  return !hasDatabase();
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!hasDatabase()) return seed.getSiteSettingsSeed();
  return cache(
    async () => {
      const [row] = await getDb()
        .select()
        .from(siteSettingsTable)
        .where(eq(siteSettingsTable.id, 1))
        .limit(1);
      return row ? mapSettings(row) : seed.getSiteSettingsSeed();
    },
    ["site-settings"],
    { tags: [TAGS.settings], revalidate: 300 },
  )();
}

export async function getAdventures(kind?: AdventureKind): Promise<Adventure[]> {
  if (!hasDatabase()) return seed.getAdventuresSeed(kind);
  return cache(
    async () => {
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
    },
    ["adventures", kind ?? "all"],
    { tags: [TAGS.adventures], revalidate: 60 },
  )();
}

/**
 * The "Other adventures" from the blueprint — paragliding, zip-lining and
 * anything else that is neither a rafting stretch nor the bungee jump. Same
 * table, filtered by kind.
 */
export async function getActivities(): Promise<Adventure[]> {
  const all = await getAdventures();
  return all.filter((a) => a.kind !== "rafting" && a.kind !== "bungee");
}

/** Rafting stretches ordered by the axis the whole product is sold on. */
export async function getRaftingByDistance(): Promise<Adventure[]> {
  const list = await getAdventures("rafting");
  return [...list].sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
}

export async function getAdventure(slug: string): Promise<Adventure | null> {
  if (!hasDatabase()) return seed.getAdventureSeed(slug);
  return cache(
    async () => {
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
    },
    ["adventure", slug],
    { tags: [TAGS.adventures, `adventure:${slug}`], revalidate: 60 },
  )();
}

export async function getHotels(): Promise<Hotel[]> {
  if (!hasDatabase()) return seed.getHotelsSeed();
  return cache(
    async () => {
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
    },
    ["hotels"],
    { tags: [TAGS.hotels], revalidate: 60 },
  )();
}

export async function getHotel(slug: string): Promise<Hotel | null> {
  if (!hasDatabase()) return seed.getHotelSeed(slug);
  return cache(
    async () => {
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
    },
    ["hotel", slug],
    { tags: [TAGS.hotels, `hotel:${slug}`], revalidate: 60 },
  )();
}

export async function getReviews(): Promise<Review[]> {
  if (!hasDatabase()) return seed.getReviewsSeed();
  return cache(
    async () => {
      const rows = await getDb()
        .select()
        .from(reviewsTable)
        .where(eq(reviewsTable.isPublished, true))
        .orderBy(reviewsTable.sortOrder);
      return rows.map(mapReview);
    },
    ["reviews"],
    { tags: [TAGS.reviews], revalidate: 300 },
  )();
}

/** All published gallery photos, newest-curated-first order. Filter by category client-side — the whole set is small enough to ship in one request and switch instantly. */
export async function getGalleryItems(): Promise<GalleryItem[]> {
  if (!hasDatabase()) return seed.getGalleryItemsSeed();
  return cache(
    async () => {
      const rows = await getDb()
        .select({ item: galleryItemsTable, media: mediaTable })
        .from(galleryItemsTable)
        .innerJoin(mediaTable, eq(galleryItemsTable.mediaId, mediaTable.id))
        .where(eq(galleryItemsTable.isPublished, true))
        .orderBy(galleryItemsTable.sortOrder);
      return rows.map((r) => mapGalleryItem(r.item, r.media));
    },
    ["gallery"],
    { tags: [TAGS.gallery], revalidate: 300 },
  )();
}

export async function getClosures(): Promise<Closure[]> {
  if (!hasDatabase()) return seed.getClosuresSeed();
  return cache(
    async () => {
      const rows = await getDb()
        .select()
        .from(closuresTable)
        .where(eq(closuresTable.isActive, true));
      return rows.map(mapClosure);
    },
    ["closures"],
    // Short-lived: this is the value the monsoon switch controls, and it must
    // never be stale for the length of a full ISR window.
    { tags: [TAGS.closures], revalidate: 30 },
  )();
}

/**
 * A named, admin-editable page section (the "Why book with us" grid and
 * anything like it later). `key` is the renderer's contract with the row —
 * a section can be re-copied and reordered from the admin panel, but it can
 * never lose the component that knows how to draw it.
 */
export async function getContentBlock(key: string): Promise<ContentBlock | null> {
  if (!hasDatabase()) return null;
  return cache(
    async () => {
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
    },
    ["content-block", key],
    { tags: [TAGS.content, `content-block:${key}`], revalidate: 300 },
  )();
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
    rating: num(row.rating),
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
  if (!hasDatabase()) return seed.getDestinationsSeed();
  return cache(
    async () => {
      const rows = await getDb()
        .select()
        .from(destinationsTable)
        .where(eq(destinationsTable.isPublished, true))
        .orderBy(destinationsTable.sortOrder);
      const mediaMap = await getMediaByIds(rows.map((r) => r.coverMediaId));
      return rows.map((r) =>
        mapDestination(r, r.coverMediaId ? mediaMap.get(r.coverMediaId) : undefined),
      );
    },
    ["destinations"],
    { tags: [TAGS.destinations], revalidate: 300 },
  )();
}

export async function getDestination(slug: string): Promise<Destination | null> {
  if (!hasDatabase()) return seed.getDestinationSeed(slug);
  return cache(
    async () => {
      const [row] = await getDb()
        .select()
        .from(destinationsTable)
        .where(and(eq(destinationsTable.slug, slug), eq(destinationsTable.isPublished, true)))
        .limit(1);
      if (!row) return null;
      const mediaMap = await getMediaByIds([row.coverMediaId]);
      return mapDestination(row, row.coverMediaId ? mediaMap.get(row.coverMediaId) : undefined);
    },
    ["destination", slug],
    { tags: [TAGS.destinations, `destination:${slug}`], revalidate: 300 },
  )();
}

export async function getPackages(): Promise<Package[]> {
  if (!hasDatabase()) return seed.getPackagesSeed();
  return cache(
    async () => {
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
    },
    ["packages"],
    { tags: [TAGS.packages], revalidate: 120 },
  )();
}

export async function getPackage(slug: string): Promise<Package | null> {
  if (!hasDatabase()) return seed.getPackageSeed(slug);
  return cache(
    async () => {
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
    },
    ["package", slug],
    { tags: [TAGS.packages, `package:${slug}`], revalidate: 120 },
  )();
}

/** Published packages whose primary destination is this one. */
export async function getPackagesForDestination(destinationId: number): Promise<Package[]> {
  const all = await getPackages();
  const [dest] = hasDatabase()
    ? await getDb()
        .select({ slug: destinationsTable.slug })
        .from(destinationsTable)
        .where(eq(destinationsTable.id, destinationId))
        .limit(1)
    : [{ slug: (await seed.getDestinationsSeed()).find((d) => d.id === destinationId)?.slug }];
  return all.filter((p) => p.destinationSlug && p.destinationSlug === dest?.slug);
}

export async function getRentals(): Promise<Rental[]> {
  if (!hasDatabase()) return seed.getRentalsSeed();
  return cache(
    async () => {
      const rows = await getDb()
        .select()
        .from(rentalsTable)
        .where(eq(rentalsTable.isPublished, true))
        .orderBy(rentalsTable.sortOrder);
      const mediaMap = await getMediaByIds(rows.map((r) => r.coverMediaId));
      return rows.map((r) => mapRental(r, r.coverMediaId ? mediaMap.get(r.coverMediaId) : undefined));
    },
    ["rentals"],
    { tags: [TAGS.rentals], revalidate: 300 },
  )();
}

export async function getRental(slug: string): Promise<Rental | null> {
  if (!hasDatabase()) return seed.getRentalSeed(slug);
  return cache(
    async () => {
      const [row] = await getDb()
        .select()
        .from(rentalsTable)
        .where(and(eq(rentalsTable.slug, slug), eq(rentalsTable.isPublished, true)))
        .limit(1);
      if (!row) return null;
      const mediaMap = await getMediaByIds([row.coverMediaId]);
      return mapRental(row, row.coverMediaId ? mediaMap.get(row.coverMediaId) : undefined);
    },
    ["rental", slug],
    { tags: [TAGS.rentals, `rental:${slug}`], revalidate: 300 },
  )();
}

export const contentTags = TAGS;
