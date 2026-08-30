"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { and, eq, gt, lt, ne, notInArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { hotelRooms, hotels } from "@/db/schema";
import { getVerifiedSession } from "@/lib/auth";
import { contentTags } from "@/lib/content";
import { logAudit } from "@/lib/audit";
import { hotelSchema } from "@/lib/schemas/hotel";

async function requireAdmin() {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");
  return session;
}

function revalidateHotelPaths(slug: string, prevSlug?: string) {
  revalidateTag(contentTags.hotels);
  revalidateTag(`hotel:${slug}`);
  if (prevSlug && prevSlug !== slug) revalidateTag(`hotel:${prevSlug}`);

  revalidatePath("/");
  revalidatePath("/hotels");
  revalidatePath(`/hotels/${slug}`);
  // Destination pages list the stays tied to them.
  revalidatePath("/stays/[slug]", "page");
  if (prevSlug && prevSlug !== slug) revalidatePath(`/hotels/${prevSlug}`);
}

export type HotelActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

function zodErrorState(err: import("zod").ZodError): HotelActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Check the highlighted fields.", fieldErrors };
}

function toHotelShape(data: import("@/lib/schemas/hotel").HotelFormValues) {
  return {
    name: data.name,
    slug: data.slug,
    tagline: data.tagline,
    description: data.description,
    address: data.address,
    locality: data.locality,
    destinationId: data.destinationId,
    mapUrl: data.mapUrl || null,
    starRating: data.starRating,
    pricePerNightInr: data.pricePerNightInr,
    compareAtPriceInr: data.compareAtPriceInr,
    rating: data.rating === null ? null : String(data.rating),
    reviewCount: data.reviewCount,
    badge: data.badge,
    checkInTime: data.checkInTime,
    checkOutTime: data.checkOutTime,
    amenities: data.amenities,
    houseRules: data.houseRules,
    faqs: data.faqs,
    coverMediaId: data.coverMediaId,
    isPublished: data.isPublished,
  };
}

/**
 * Rooms have no natural key of their own, so on every save the room set for
 * this hotel is replaced wholesale: update rows the form still has an id for,
 * insert the rest, delete anything the form dropped. Simpler and safer than
 * diffing — a room table never has enough rows for this to be slow.
 */
async function syncRooms(hotelId: number, rooms: import("@/lib/schemas/hotel").RoomFormValues[]) {
  const db = getDb();
  const keepIds: number[] = [];

  for (const room of rooms) {
    const shape = {
      hotelId,
      name: room.name,
      occupancy: room.occupancy,
      bedType: room.bedType,
      pricePerNightInr: room.pricePerNightInr,
      inclusions: room.inclusions,
      mediaId: room.mediaId,
    };
    if (room.id) {
      await db.update(hotelRooms).set(shape).where(eq(hotelRooms.id, room.id));
      keepIds.push(room.id);
    } else {
      const [row] = await db.insert(hotelRooms).values(shape).returning({ id: hotelRooms.id });
      keepIds.push(row.id);
    }
  }

  await db
    .delete(hotelRooms)
    .where(
      keepIds.length
        ? and(eq(hotelRooms.hotelId, hotelId), notInArray(hotelRooms.id, keepIds))
        : eq(hotelRooms.hotelId, hotelId),
    );

  // sortOrder follows form order, so drag-reordered rooms persist.
  for (const [i, id] of keepIds.entries()) {
    await db.update(hotelRooms).set({ sortOrder: i }).where(eq(hotelRooms.id, id));
  }
}

export async function createHotel(input: unknown): Promise<HotelActionState> {
  const session = await requireAdmin();
  const parsed = hotelSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const data = parsed.data;

  const db = getDb();
  const dup = await db.select({ id: hotels.id }).from(hotels).where(eq(hotels.slug, data.slug)).limit(1);
  if (dup.length) {
    return { ok: false, error: "That slug is already used.", fieldErrors: { slug: "Already taken." } };
  }

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${hotels.sortOrder}), 0)` })
    .from(hotels);

  const [row] = await db
    .insert(hotels)
    .values({ ...toHotelShape(data), sortOrder: max + 1 })
    .returning({ id: hotels.id });

  await syncRooms(row.id, data.rooms);
  revalidateHotelPaths(data.slug);
  await logAudit(session, { action: "create", entityType: "hotel", entityId: row.id, label: data.name });
  return { ok: true, id: row.id };
}

export async function updateHotel(id: number, input: unknown): Promise<HotelActionState> {
  const session = await requireAdmin();
  const parsed = hotelSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const data = parsed.data;

  const db = getDb();
  const [existing] = await db.select({ slug: hotels.slug }).from(hotels).where(eq(hotels.id, id)).limit(1);
  if (!existing) return { ok: false, error: "That hotel no longer exists." };

  const dup = await db
    .select({ id: hotels.id })
    .from(hotels)
    .where(and(eq(hotels.slug, data.slug), ne(hotels.id, id)))
    .limit(1);
  if (dup.length) {
    return { ok: false, error: "That slug is already used.", fieldErrors: { slug: "Already taken." } };
  }

  await db.update(hotels).set(toHotelShape(data)).where(eq(hotels.id, id));
  await syncRooms(id, data.rooms);

  revalidateHotelPaths(data.slug, existing.slug);
  await logAudit(session, { action: "update", entityType: "hotel", entityId: id, label: data.name });
  return { ok: true, id };
}

export async function deleteHotel(id: number) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ slug: hotels.slug, name: hotels.name })
    .from(hotels)
    .where(eq(hotels.id, id))
    .limit(1);
  if (!row) return;
  // hotel_rooms cascades; enquiries referencing this hotel survive via
  // ON DELETE SET NULL plus their own name/price snapshot.
  await db.delete(hotels).where(eq(hotels.id, id));
  revalidateHotelPaths(row.slug);
  await logAudit(session, { action: "delete", entityType: "hotel", entityId: id, label: row.name });
}

export async function setHotelPublished(id: number, isPublished: boolean) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .update(hotels)
    .set({ isPublished })
    .where(eq(hotels.id, id))
    .returning({ slug: hotels.slug, name: hotels.name });
  if (row) {
    revalidateHotelPaths(row.slug);
    await logAudit(session, {
      action: isPublished ? "publish" : "unpublish",
      entityType: "hotel",
      entityId: id,
      label: row.name,
    });
  }
}

export async function moveHotel(id: number, direction: "up" | "down") {
  await requireAdmin();
  const db = getDb();
  const [current] = await db.select().from(hotels).where(eq(hotels.id, id)).limit(1);
  if (!current) return;

  const [neighbour] = await db
    .select()
    .from(hotels)
    .where(
      direction === "up"
        ? lt(hotels.sortOrder, current.sortOrder)
        : gt(hotels.sortOrder, current.sortOrder),
    )
    .orderBy(direction === "up" ? sql`${hotels.sortOrder} desc` : sql`${hotels.sortOrder} asc`)
    .limit(1);
  if (!neighbour) return;

  await db.update(hotels).set({ sortOrder: neighbour.sortOrder }).where(eq(hotels.id, current.id));
  await db.update(hotels).set({ sortOrder: current.sortOrder }).where(eq(hotels.id, neighbour.id));

  revalidateTag(contentTags.hotels);
  revalidatePath("/");
  revalidatePath("/hotels");
}
