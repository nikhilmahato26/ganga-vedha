import "server-only";
import { and, desc, eq, inArray, notExists, or, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  adminUsers,
  adventures,
  auditLog,
  closures,
  destinations,
  enquiries,
  galleryItems,
  hotelRooms,
  hotels,
  media,
  mediaLinks,
  packages,
  rentals,
  reviews,
  siteSettings,
} from "@/db/schema";

/**
 * Admin reads. Unlike `@/lib/content`, these are never cached and never
 * filter to `isPublished` — the owner must always see the current row,
 * draft or live, and must never look at a screen that is seconds or minutes
 * behind what they just saved.
 */

export async function listAdventuresAdmin(
  kind: "rafting" | "bungee" | "paragliding" | "zipline",
) {
  return getDb()
    .select()
    .from(adventures)
    .where(eq(adventures.kind, kind))
    .orderBy(adventures.sortOrder);
}

/** Distinct operator names already used on published/draft bungee jumps. */
export async function listBungeeBrands(): Promise<string[]> {
  const rows = await getDb()
    .select({ brand: adventures.brand })
    .from(adventures)
    .where(eq(adventures.kind, "bungee"));
  const set = new Set<string>();
  for (const r of rows) {
    const b = r.brand?.trim();
    if (b) set.add(b);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** The non-river activities — paragliding, zip-lining — for their own admin list. */
export async function listActivitiesAdmin() {
  return getDb()
    .select()
    .from(adventures)
    .where(inArray(adventures.kind, ["paragliding", "zipline"]))
    .orderBy(adventures.sortOrder);
}

export async function getAdventureAdmin(id: number) {
  const [row] = await getDb().select().from(adventures).where(eq(adventures.id, id)).limit(1);
  return row ?? null;
}

export async function listHotelsAdmin() {
  return getDb().query.hotels.findMany({
    orderBy: hotels.sortOrder,
    with: { rooms: { orderBy: hotelRooms.sortOrder } },
  });
}

export async function getHotelAdmin(id: number) {
  return getDb().query.hotels.findFirst({
    where: eq(hotels.id, id),
    with: { rooms: { orderBy: hotelRooms.sortOrder } },
  });
}

export async function listPackagesAdmin() {
  return getDb().select().from(packages).orderBy(packages.sortOrder);
}

export async function getPackageAdmin(id: number) {
  const [row] = await getDb().select().from(packages).where(eq(packages.id, id)).limit(1);
  return row ?? null;
}

export async function listRentalsAdmin() {
  return getDb().select().from(rentals).orderBy(rentals.sortOrder);
}

export async function getRentalAdmin(id: number) {
  const [row] = await getDb().select().from(rentals).where(eq(rentals.id, id)).limit(1);
  return row ?? null;
}

export async function listDestinationsAdmin() {
  return getDb().select().from(destinations).orderBy(destinations.sortOrder);
}

export async function getDestinationAdmin(id: number) {
  const [row] = await getDb().select().from(destinations).where(eq(destinations.id, id)).limit(1);
  return row ?? null;
}

/** id + name pairs for the "primary destination" picker on the package form. */
export async function listDestinationOptions() {
  return getDb()
    .select({ id: destinations.id, name: destinations.name })
    .from(destinations)
    .orderBy(destinations.sortOrder);
}

export async function listReviewsAdmin() {
  return getDb().select().from(reviews).orderBy(reviews.sortOrder);
}

/** Every gallery photo, published or not, newest-added first — the admin's own review of what's in it. */
export async function listGalleryItemsAdmin() {
  return getDb()
    .select({ item: galleryItems, media })
    .from(galleryItems)
    .innerJoin(media, eq(galleryItems.mediaId, media.id))
    .orderBy(galleryItems.sortOrder);
}

export async function getReviewAdmin(id: number) {
  const [row] = await getDb().select().from(reviews).where(eq(reviews.id, id)).limit(1);
  return row ?? null;
}

/** Every closure the owner set up for a specific reason, newest first — the fixed three service switches live separately in `listServiceClosures`. */
export async function listCustomClosuresAdmin() {
  const rows = await getDb()
    .select()
    .from(closures)
    .where(inArray(closures.scope, ["entity", "global"]))
    .orderBy(desc(closures.createdAt));

  const adventureIds = rows
    .filter((r) => r.entityType === "adventure" && r.entityId !== null)
    .map((r) => r.entityId!);
  const hotelIds = rows
    .filter((r) => r.entityType === "hotel" && r.entityId !== null)
    .map((r) => r.entityId!);

  const [adventureRows, hotelRows] = await Promise.all([
    adventureIds.length
      ? getDb().select({ id: adventures.id, name: adventures.name }).from(adventures).where(inArray(adventures.id, adventureIds))
      : Promise.resolve([]),
    hotelIds.length
      ? getDb().select({ id: hotels.id, name: hotels.name }).from(hotels).where(inArray(hotels.id, hotelIds))
      : Promise.resolve([]),
  ]);
  const nameByKey = new Map<string, string>([
    ...adventureRows.map((r) => [`adventure:${r.id}`, r.name] as const),
    ...hotelRows.map((r) => [`hotel:${r.id}`, r.name] as const),
  ]);

  return rows.map((r) => ({
    id: r.id,
    // The WHERE clause already restricts this to "entity" | "global" — Drizzle's
    // return type can't see that, so narrow it explicitly rather than widen the
    // admin type to include "service" (which belongs only to the three switches).
    scope: r.scope as "entity" | "global",
    entityType: r.entityType as "adventure" | "hotel" | null,
    entityId: r.entityId,
    // A closure can outlive the listing it targeted if that listing is later
    // deleted — the row itself is never cascaded away, so this stays honest
    // about a target that no longer exists rather than showing a blank.
    entityName:
      r.entityType && r.entityId !== null
        ? (nameByKey.get(`${r.entityType}:${r.entityId}`) ?? "Deleted listing")
        : null,
    isActive: r.isActive,
    icon: r.icon,
    title: r.title,
    body: r.body,
    footnote: r.footnote,
    ctaLabel: r.ctaLabel,
  }));
}

/** Every publishable adventure and hotel, for the "which listing" picker on a new closure. */
export async function listClosureTargets() {
  const [adventureRows, hotelRows] = await Promise.all([
    getDb()
      .select({ id: adventures.id, name: adventures.name, kind: adventures.kind })
      .from(adventures)
      .orderBy(adventures.name),
    getDb().select({ id: hotels.id, name: hotels.name }).from(hotels).orderBy(hotels.name),
  ]);
  return { adventures: adventureRows, hotels: hotelRows };
}

export async function getMediaById(id: number | null) {
  if (!id) return null;
  const [row] = await getDb().select().from(media).where(eq(media.id, id)).limit(1);
  return row ?? null;
}

export async function getEntityGallery(
  entityType: "hotel" | "adventure" | "gallery" | "service_line" | "review",
  entityId: number,
) {
  const rows = await getDb()
    .select({
      id: media.id,
      secureUrl: media.secureUrl,
      altText: media.altText,
      sortOrder: mediaLinks.sortOrder,
    })
    .from(mediaLinks)
    .innerJoin(media, eq(mediaLinks.mediaId, media.id))
    .where(and(eq(mediaLinks.entityType, entityType), eq(mediaLinks.entityId, entityId)))
    .orderBy(mediaLinks.sortOrder);
  return rows;
}

export type EnquiryStatus = "new" | "contacted" | "confirmed" | "completed" | "lost";

export async function listEnquiriesAdmin(status?: EnquiryStatus) {
  const db = getDb();
  return db
    .select()
    .from(enquiries)
    .where(status ? eq(enquiries.status, status) : undefined)
    .orderBy(desc(enquiries.createdAt))
    .limit(300);
}

export async function getEnquiryAdmin(id: number) {
  const [row] = await getDb().select().from(enquiries).where(eq(enquiries.id, id)).limit(1);
  return row ?? null;
}

/**
 * The numbers the dashboard leads with. `today`/`week`/`month` are counts of
 * NEW enquiries in each window (what just came in); `funnel` is the current
 * status distribution across everything (where the pipeline actually stands).
 */
export async function getEnquiryStats() {
  const db = getDb();
  const [windowCounts] = await db
    .select({
      today: sql<number>`count(*) filter (where ${enquiries.createdAt} > now() - interval '1 day')`,
      week: sql<number>`count(*) filter (where ${enquiries.createdAt} > now() - interval '7 days')`,
      month: sql<number>`count(*) filter (where ${enquiries.createdAt} > now() - interval '30 days')`,
    })
    .from(enquiries);

  const funnelRows = await db
    .select({ status: enquiries.status, count: sql<number>`count(*)` })
    .from(enquiries)
    .groupBy(enquiries.status);

  // Enquiries per product kind — rafting / bungee / hotel / package / rental /
  // activity / general — so the dashboard shows where demand actually is.
  const kindRows = await db
    .select({ kind: enquiries.productKind, count: sql<number>`count(*)` })
    .from(enquiries)
    .groupBy(enquiries.productKind);

  // The single most-enquired product, across every kind (not just rafting).
  const topProduct = await db
    .select({
      name: enquiries.productNameSnapshot,
      kind: enquiries.productKind,
      count: sql<number>`count(*)`,
    })
    .from(enquiries)
    .where(sql`${enquiries.productKind} <> 'general'`)
    .groupBy(enquiries.productNameSnapshot, enquiries.productKind)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  return {
    today: Number(windowCounts?.today ?? 0),
    week: Number(windowCounts?.week ?? 0),
    month: Number(windowCounts?.month ?? 0),
    funnel: Object.fromEntries(funnelRows.map((r) => [r.status, Number(r.count)])) as Record<
      EnquiryStatus,
      number
    >,
    byKind: Object.fromEntries(kindRows.map((r) => [r.kind, Number(r.count)])) as Record<
      string,
      number
    >,
    topProduct: topProduct[0]
      ? { name: topProduct[0].name, kind: topProduct[0].kind as string }
      : null,
    /** @deprecated kept for backwards-compat — use `topProduct`. */
    topStretch: topProduct[0]?.kind === "rafting" ? topProduct[0].name : null,
  };
}

/**
 * A media row is "in use" if it is referenced by any cover/avatar/hero
 * column, or by a media_links gallery row. Anything left over is safe to
 * delete — this is the query that stands in for the raw SQL cleanup done by
 * hand three times while building this project.
 */
export async function listUnusedMedia() {
  const db = getDb();
  return db
    .select({
      id: media.id,
      publicId: media.publicId,
      secureUrl: media.secureUrl,
      width: media.width,
      height: media.height,
      bytes: media.bytes,
      folder: media.folder,
      createdAt: media.createdAt,
    })
    .from(media)
    .where(
      and(
        notExists(db.select().from(adventures).where(eq(adventures.coverMediaId, media.id))),
        notExists(db.select().from(hotels).where(eq(hotels.coverMediaId, media.id))),
        notExists(db.select().from(hotelRooms).where(eq(hotelRooms.mediaId, media.id))),
        notExists(db.select().from(packages).where(eq(packages.coverMediaId, media.id))),
        notExists(db.select().from(rentals).where(eq(rentals.coverMediaId, media.id))),
        notExists(db.select().from(destinations).where(eq(destinations.coverMediaId, media.id))),
        notExists(db.select().from(reviews).where(eq(reviews.avatarMediaId, media.id))),
        notExists(
          db
            .select()
            .from(siteSettings)
            .where(or(eq(siteSettings.heroMediaId, media.id), eq(siteSettings.logoMediaId, media.id))),
        ),
        notExists(db.select().from(mediaLinks).where(eq(mediaLinks.mediaId, media.id))),
        notExists(db.select().from(galleryItems).where(eq(galleryItems.mediaId, media.id))),
      ),
    )
    .orderBy(desc(media.createdAt));
}

export async function listAuditLog(limit = 200) {
  const db = getDb();
  return db
    .select({
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      label: auditLog.label,
      createdAt: auditLog.createdAt,
      adminName: adminUsers.name,
      adminEmail: adminUsers.email,
    })
    .from(auditLog)
    .leftJoin(adminUsers, eq(auditLog.adminUserId, adminUsers.id))
    .orderBy(desc(auditLog.createdAt))
    .limit(limit);
}
