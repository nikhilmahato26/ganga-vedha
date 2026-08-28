"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { adventures } from "@/db/schema";
import { getVerifiedSession } from "@/lib/auth";
import { contentTags } from "@/lib/content";
import { logAudit } from "@/lib/audit";
import { adventureSchema, type AdventureFormValues } from "@/lib/schemas/adventure";

async function requireAdmin() {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");
  return session;
}

/**
 * Every route that could possibly have rendered this content, invalidated by
 * both mechanisms available: `revalidateTag` clears the tagged data-cache
 * entries `@/lib/content` reads from, `revalidatePath` clears the rendered
 * HTML for the route directly. Belt and braces — Phase 1 could not fully
 * verify time-based ISR behaved as documented in this environment, so a
 * write path relies on neither alone.
 */
function revalidateAdventurePaths(kind: "rafting" | "bungee", slug: string, prevSlug?: string) {
  revalidateTag(contentTags.adventures);
  revalidateTag(`adventure:${slug}`);
  if (prevSlug && prevSlug !== slug) revalidateTag(`adventure:${prevSlug}`);

  revalidatePath("/");
  revalidatePath(kind === "rafting" ? "/rafting" : "/bungee");
  revalidatePath(`/${kind}/${slug}`);
  if (prevSlug && prevSlug !== slug) revalidatePath(`/${kind}/${prevSlug}`);
}

export type AdventureActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

function zodErrorState(err: import("zod").ZodError): AdventureActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Check the highlighted fields.", fieldErrors };
}

export async function createAdventure(input: unknown): Promise<AdventureActionState> {
  const session = await requireAdmin();
  const parsed = adventureSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const data = parsed.data;

  const db = getDb();
  const dup = await db
    .select({ id: adventures.id })
    .from(adventures)
    .where(eq(adventures.slug, data.slug))
    .limit(1);
  if (dup.length) {
    return { ok: false, error: "That slug is already used.", fieldErrors: { slug: "Already taken." } };
  }

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${adventures.sortOrder}), 0)` })
    .from(adventures)
    .where(eq(adventures.kind, data.kind));

  const [row] = await db
    .insert(adventures)
    .values({ ...toInsertShape(data), sortOrder: max + 1 })
    .returning({ id: adventures.id });

  revalidateAdventurePaths(data.kind, data.slug);
  await logAudit(session, {
    action: "create",
    entityType: data.kind,
    entityId: row.id,
    label: data.name,
  });
  return { ok: true, id: row.id };
}

export async function updateAdventure(
  id: number,
  input: unknown,
): Promise<AdventureActionState> {
  const session = await requireAdmin();
  const parsed = adventureSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const data = parsed.data;

  const db = getDb();
  const [existing] = await db
    .select({ slug: adventures.slug })
    .from(adventures)
    .where(eq(adventures.id, id))
    .limit(1);
  if (!existing) return { ok: false, error: "That listing no longer exists." };

  const dup = await db
    .select({ id: adventures.id })
    .from(adventures)
    .where(and(eq(adventures.slug, data.slug), ne(adventures.id, id)))
    .limit(1);
  if (dup.length) {
    return { ok: false, error: "That slug is already used.", fieldErrors: { slug: "Already taken." } };
  }

  await db.update(adventures).set(toInsertShape(data)).where(eq(adventures.id, id));

  revalidateAdventurePaths(data.kind, data.slug, existing.slug);
  await logAudit(session, {
    action: "update",
    entityType: data.kind,
    entityId: id,
    label: data.name,
  });
  return { ok: true, id };
}

export async function deleteAdventure(id: number) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ slug: adventures.slug, kind: adventures.kind, name: adventures.name })
    .from(adventures)
    .where(eq(adventures.id, id))
    .limit(1);
  if (!row) return;

  // Enquiries referencing this row survive via ON DELETE SET NULL plus their
  // own name/price snapshot — deleting the listing never deletes the leads.
  await db.delete(adventures).where(eq(adventures.id, id));
  revalidateAdventurePaths(row.kind, row.slug);
  await logAudit(session, { action: "delete", entityType: row.kind, entityId: id, label: row.name });
}

export async function setAdventurePublished(id: number, isPublished: boolean) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .update(adventures)
    .set({ isPublished })
    .where(eq(adventures.id, id))
    .returning({ slug: adventures.slug, kind: adventures.kind, name: adventures.name });
  if (row) {
    revalidateAdventurePaths(row.kind, row.slug);
    await logAudit(session, {
      action: isPublished ? "publish" : "unpublish",
      entityType: row.kind,
      entityId: id,
      label: row.name,
    });
  }
}

/**
 * Swaps this row's sortOrder with its nearest neighbour (within the same
 * `kind`, so rafting and bungee reorder independently). A swap rather than a
 * renumber of the whole list — no race with a concurrent edit elsewhere in
 * the sequence, and it is the operation a single "move up" click actually means.
 */
export async function moveAdventure(id: number, direction: "up" | "down") {
  await requireAdmin();
  const db = getDb();
  const [current] = await db.select().from(adventures).where(eq(adventures.id, id)).limit(1);
  if (!current) return;

  const [neighbour] = await db
    .select()
    .from(adventures)
    .where(
      and(
        eq(adventures.kind, current.kind),
        direction === "up"
          ? lt(adventures.sortOrder, current.sortOrder)
          : gt(adventures.sortOrder, current.sortOrder),
      ),
    )
    .orderBy(direction === "up" ? sql`${adventures.sortOrder} desc` : sql`${adventures.sortOrder} asc`)
    .limit(1);
  if (!neighbour) return; // already at the edge

  await db.update(adventures).set({ sortOrder: neighbour.sortOrder }).where(eq(adventures.id, current.id));
  await db.update(adventures).set({ sortOrder: current.sortOrder }).where(eq(adventures.id, neighbour.id));

  revalidateTag(contentTags.adventures);
  revalidatePath("/");
  revalidatePath(current.kind === "rafting" ? "/rafting" : "/bungee");
}

function toInsertShape(data: AdventureFormValues) {
  return {
    kind: data.kind,
    name: data.name,
    slug: data.slug,
    distanceKm: data.distanceKm === null ? null : String(data.distanceKm),
    heightM: data.heightM,
    putInPoint: data.putInPoint,
    grade: data.grade,
    durationMinutes: data.durationMinutes,
    priceInr: data.priceInr,
    compareAtPriceInr: data.compareAtPriceInr,
    rating: data.rating === null ? null : String(data.rating),
    reviewCount: data.reviewCount,
    badge: data.badge,
    bestFor: data.bestFor,
    summary: data.summary,
    description: data.description,
    inclusions: data.inclusions,
    exclusions: data.exclusions,
    whatToBring: data.whatToBring,
    rapids: data.rapids,
    faqs: data.faqs,
    meetingPoint: data.meetingPoint,
    minAge: data.minAge,
    minWeightKg: data.minWeightKg,
    maxWeightKg: data.maxWeightKg,
    coverMediaId: data.coverMediaId,
    isPublished: data.isPublished,
  };
}
