import type { Admin } from "../lib/auth";
import type { GalleryActionState } from "../../../frontend/src/lib/action-types";
import { eq, gt, lt, sql } from "drizzle-orm";
import { getDb } from "../db";
import { galleryItems } from "../schema";
import { logAudit } from "../lib/audit";
import { galleryItemSchema } from "../../../frontend/src/lib/schemas/gallery";




function zodErrorState(err: import("zod").ZodError): GalleryActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Check the highlighted fields.", fieldErrors };
}

/** Called once per photo right after it finishes uploading — an upload IS the add, there is no separate save step. */
export async function createGalleryItem(admin: Admin, input: unknown): Promise<GalleryActionState> {
  const parsed = galleryItemSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const db = getDb();

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${galleryItems.sortOrder}), 0)` })
    .from(galleryItems);

  const [row] = await db
    .insert(galleryItems)
    .values({ ...parsed.data, sortOrder: max + 1 })
    .returning({ id: galleryItems.id });

  await logAudit(admin, {
    action: "create",
    entityType: "gallery_item",
    entityId: row.id,
    label: `Gallery photo added${parsed.data.category ? ` (${parsed.data.category})` : ""}`,
  });
  return { ok: true, id: row.id };
}

/** Category, caption, and the publish toggle all save themselves the moment they change — no separate submit. */
export async function updateGalleryItem(admin: Admin, id: number, input: unknown): Promise<GalleryActionState> {
  const parsed = galleryItemSchema.partial().safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const db = getDb();

  await db.update(galleryItems).set(parsed.data).where(eq(galleryItems.id, id));
  await logAudit(admin, {
    action: "update",
    entityType: "gallery_item",
    entityId: id,
    label: "Gallery photo updated",
  });
  return { ok: true, id };
}

export async function deleteGalleryItem(admin: Admin, id: number) {
  const db = getDb();
  await db.delete(galleryItems).where(eq(galleryItems.id, id));
  await logAudit(admin, { action: "delete", entityType: "gallery_item", entityId: id, label: "Gallery photo removed" });
}

export async function moveGalleryItem(_admin: Admin, id: number, direction: "up" | "down") {
  const db = getDb();
  const [current] = await db.select().from(galleryItems).where(eq(galleryItems.id, id)).limit(1);
  if (!current) return;

  const [neighbour] = await db
    .select()
    .from(galleryItems)
    .where(
      direction === "up"
        ? lt(galleryItems.sortOrder, current.sortOrder)
        : gt(galleryItems.sortOrder, current.sortOrder),
    )
    .orderBy(direction === "up" ? sql`${galleryItems.sortOrder} desc` : sql`${galleryItems.sortOrder} asc`)
    .limit(1);
  if (!neighbour) return;

  await db.update(galleryItems).set({ sortOrder: neighbour.sortOrder }).where(eq(galleryItems.id, current.id));
  await db.update(galleryItems).set({ sortOrder: current.sortOrder }).where(eq(galleryItems.id, neighbour.id));
}
