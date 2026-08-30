"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { destinations } from "@/db/schema";
import { getVerifiedSession } from "@/lib/auth";
import { contentTags } from "@/lib/content";
import { logAudit } from "@/lib/audit";
import { destinationSchema, type DestinationFormValues } from "@/lib/schemas/destination";

async function requireAdmin() {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");
  return session;
}

function revalidateDestinationPaths(slug: string, prevSlug?: string) {
  revalidateTag(contentTags.destinations);
  revalidateTag(`destination:${slug}`);
  if (prevSlug && prevSlug !== slug) revalidateTag(`destination:${prevSlug}`);
  revalidatePath("/stays");
  revalidatePath(`/stays/${slug}`);
  if (prevSlug && prevSlug !== slug) revalidatePath(`/stays/${prevSlug}`);
}

export type DestinationActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

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

export async function createDestination(input: unknown): Promise<DestinationActionState> {
  const session = await requireAdmin();
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

  revalidateDestinationPaths(data.slug);
  await logAudit(session, {
    action: "create",
    entityType: "destination",
    entityId: row.id,
    label: data.name,
  });
  return { ok: true, id: row.id };
}

export async function updateDestination(
  id: number,
  input: unknown,
): Promise<DestinationActionState> {
  const session = await requireAdmin();
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
  revalidateDestinationPaths(data.slug, existing.slug);
  await logAudit(session, {
    action: "update",
    entityType: "destination",
    entityId: id,
    label: data.name,
  });
  return { ok: true, id };
}

export async function deleteDestination(id: number) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ slug: destinations.slug, name: destinations.name })
    .from(destinations)
    .where(eq(destinations.id, id))
    .limit(1);
  if (!row) return;
  // hotels.destination_id and packages.destination_id are ON DELETE SET NULL.
  await db.delete(destinations).where(eq(destinations.id, id));
  revalidateDestinationPaths(row.slug);
  revalidateTag(contentTags.hotels);
  revalidateTag(contentTags.packages);
  await logAudit(session, {
    action: "delete",
    entityType: "destination",
    entityId: id,
    label: row.name,
  });
}

export async function setDestinationPublished(id: number, isPublished: boolean) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .update(destinations)
    .set({ isPublished })
    .where(eq(destinations.id, id))
    .returning({ slug: destinations.slug, name: destinations.name });
  if (row) {
    revalidateDestinationPaths(row.slug);
    await logAudit(session, {
      action: isPublished ? "publish" : "unpublish",
      entityType: "destination",
      entityId: id,
      label: row.name,
    });
  }
}

export async function moveDestination(id: number, direction: "up" | "down") {
  await requireAdmin();
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
  revalidateTag(contentTags.destinations);
  revalidatePath("/stays");
}
