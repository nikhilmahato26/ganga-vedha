import type { Admin } from "../lib/auth";
import type { DestinationActionState } from "../../../frontend/src/lib/action-types";
import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import { getDb } from "../db";
import { destinations } from "../schema";
import { logAudit } from "../lib/audit";
import { destinationSchema, type DestinationFormValues } from "../../../frontend/src/lib/schemas/destination";




function zodErrorState(err: import("zod").ZodError): DestinationActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Check the highlighted fields.", fieldErrors };
}

function toShape(data: DestinationFormValues) {
  return {
    name: data.name,
    slug: data.slug,
    region: data.region,
    tagline: data.tagline,
    intro: data.intro,
    highlights: data.highlights,
    bestTime: data.bestTime,
    howToReach: data.howToReach,
    faqs: data.faqs,
    coverMediaId: data.coverMediaId,
    isPublished: data.isPublished,
  };
}

export async function createDestination(admin: Admin, input: unknown): Promise<DestinationActionState> {
  const parsed = destinationSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const data = parsed.data;

  const db = getDb();
  const dup = await db
    .select({ id: destinations.id })
    .from(destinations)
    .where(eq(destinations.slug, data.slug))
    .limit(1);
  if (dup.length) {
    return { ok: false, error: "That slug is already used.", fieldErrors: { slug: "Already taken." } };
  }

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${destinations.sortOrder}), 0)` })
    .from(destinations);

  const [row] = await db
    .insert(destinations)
    .values({ ...toShape(data), sortOrder: max + 1 })
    .returning({ id: destinations.id });

  await logAudit(admin, {
    action: "create",
    entityType: "destination",
    entityId: row.id,
    label: data.name,
  });
  return { ok: true, id: row.id };
}

export async function updateDestination(
  admin: Admin,
  id: number,
  input: unknown,
): Promise<DestinationActionState> {
  const parsed = destinationSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const data = parsed.data;

  const db = getDb();
  const [existing] = await db
    .select({ slug: destinations.slug })
    .from(destinations)
    .where(eq(destinations.id, id))
    .limit(1);
  if (!existing) return { ok: false, error: "That destination no longer exists." };

  const dup = await db
    .select({ id: destinations.id })
    .from(destinations)
    .where(and(eq(destinations.slug, data.slug), ne(destinations.id, id)))
    .limit(1);
  if (dup.length) {
    return { ok: false, error: "That slug is already used.", fieldErrors: { slug: "Already taken." } };
  }

  await db.update(destinations).set(toShape(data)).where(eq(destinations.id, id));
  await logAudit(admin, {
    action: "update",
    entityType: "destination",
    entityId: id,
    label: data.name,
  });
  return { ok: true, id };
}

export async function deleteDestination(admin: Admin, id: number) {
  const db = getDb();
  const [row] = await db
    .select({ slug: destinations.slug, name: destinations.name })
    .from(destinations)
    .where(eq(destinations.id, id))
    .limit(1);
  if (!row) return;
  // hotels.destination_id and packages.destination_id are ON DELETE SET NULL.
  await db.delete(destinations).where(eq(destinations.id, id));
  await logAudit(admin, {
    action: "delete",
    entityType: "destination",
    entityId: id,
    label: row.name,
  });
}

export async function setDestinationPublished(admin: Admin, id: number, isPublished: boolean) {
  const db = getDb();
  const [row] = await db
    .update(destinations)
    .set({ isPublished })
    .where(eq(destinations.id, id))
    .returning({ slug: destinations.slug, name: destinations.name });
  if (row) {
    await logAudit(admin, {
      action: isPublished ? "publish" : "unpublish",
      entityType: "destination",
      entityId: id,
      label: row.name,
    });
  }
}

export async function moveDestination(_admin: Admin, id: number, direction: "up" | "down") {
  const db = getDb();
  const [current] = await db.select().from(destinations).where(eq(destinations.id, id)).limit(1);
  if (!current) return;

  const [neighbour] = await db
    .select()
    .from(destinations)
    .where(
      direction === "up"
        ? lt(destinations.sortOrder, current.sortOrder)
        : gt(destinations.sortOrder, current.sortOrder),
    )
    .orderBy(
      direction === "up" ? sql`${destinations.sortOrder} desc` : sql`${destinations.sortOrder} asc`,
    )
    .limit(1);
  if (!neighbour) return;

  await db
    .update(destinations)
    .set({ sortOrder: neighbour.sortOrder })
    .where(eq(destinations.id, current.id));
  await db
    .update(destinations)
    .set({ sortOrder: current.sortOrder })
    .where(eq(destinations.id, neighbour.id));
}
