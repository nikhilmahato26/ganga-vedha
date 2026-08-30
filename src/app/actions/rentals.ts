"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { rentals } from "@/db/schema";
import { getVerifiedSession } from "@/lib/auth";
import { contentTags } from "@/lib/content";
import { logAudit } from "@/lib/audit";
import { rentalSchema, type RentalFormValues } from "@/lib/schemas/rental";

async function requireAdmin() {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");
  return session;
}

function revalidateRentalPaths(slug: string, prevSlug?: string) {
  revalidateTag(contentTags.rentals);
  revalidateTag(`rental:${slug}`);
  if (prevSlug && prevSlug !== slug) revalidateTag(`rental:${prevSlug}`);
  revalidatePath("/rentals");
  revalidatePath(`/rentals/${slug}`);
  if (prevSlug && prevSlug !== slug) revalidatePath(`/rentals/${prevSlug}`);
}

export type RentalActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

function zodErrorState(err: import("zod").ZodError): RentalActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Check the highlighted fields.", fieldErrors };
}

function toShape(data: RentalFormValues) {
  return {
    kind: data.kind,
    name: data.name,
    slug: data.slug,
    quoteOnly: data.quoteOnly,
    perDayInr: data.quoteOnly ? null : data.perDayInr,
    depositInr: data.depositInr,
    seats: data.seats,
    transmission: data.transmission,
    fuelNote: data.fuelNote,
    summary: data.summary,
    description: data.description,
    includes: data.includes,
    documentsRequired: data.documentsRequired,
    terms: data.terms,
    pickupNote: data.pickupNote,
    faqs: data.faqs,
    coverMediaId: data.coverMediaId,
    isPublished: data.isPublished,
  };
}

export async function createRental(input: unknown): Promise<RentalActionState> {
  const session = await requireAdmin();
  const parsed = rentalSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const data = parsed.data;

  const db = getDb();
  const dup = await db.select({ id: rentals.id }).from(rentals).where(eq(rentals.slug, data.slug)).limit(1);
  if (dup.length) {
    return { ok: false, error: "That slug is already used.", fieldErrors: { slug: "Already taken." } };
  }

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${rentals.sortOrder}), 0)` })
    .from(rentals);

  const [row] = await db
    .insert(rentals)
    .values({ ...toShape(data), sortOrder: max + 1 })
    .returning({ id: rentals.id });

  revalidateRentalPaths(data.slug);
  await logAudit(session, { action: "create", entityType: "rental", entityId: row.id, label: data.name });
  return { ok: true, id: row.id };
}

export async function updateRental(id: number, input: unknown): Promise<RentalActionState> {
  const session = await requireAdmin();
  const parsed = rentalSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const data = parsed.data;

  const db = getDb();
  const [existing] = await db.select({ slug: rentals.slug }).from(rentals).where(eq(rentals.id, id)).limit(1);
  if (!existing) return { ok: false, error: "That rental no longer exists." };

  const dup = await db
    .select({ id: rentals.id })
    .from(rentals)
    .where(and(eq(rentals.slug, data.slug), ne(rentals.id, id)))
    .limit(1);
  if (dup.length) {
    return { ok: false, error: "That slug is already used.", fieldErrors: { slug: "Already taken." } };
  }

  await db.update(rentals).set(toShape(data)).where(eq(rentals.id, id));
  revalidateRentalPaths(data.slug, existing.slug);
  await logAudit(session, { action: "update", entityType: "rental", entityId: id, label: data.name });
  return { ok: true, id };
}

export async function deleteRental(id: number) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ slug: rentals.slug, name: rentals.name })
    .from(rentals)
    .where(eq(rentals.id, id))
    .limit(1);
  if (!row) return;
  await db.delete(rentals).where(eq(rentals.id, id));
  revalidateRentalPaths(row.slug);
  await logAudit(session, { action: "delete", entityType: "rental", entityId: id, label: row.name });
}

export async function setRentalPublished(id: number, isPublished: boolean) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .update(rentals)
    .set({ isPublished })
    .where(eq(rentals.id, id))
    .returning({ slug: rentals.slug, name: rentals.name });
  if (row) {
    revalidateRentalPaths(row.slug);
    await logAudit(session, {
      action: isPublished ? "publish" : "unpublish",
      entityType: "rental",
      entityId: id,
      label: row.name,
    });
  }
}

export async function moveRental(id: number, direction: "up" | "down") {
  await requireAdmin();
  const db = getDb();
  const [current] = await db.select().from(rentals).where(eq(rentals.id, id)).limit(1);
  if (!current) return;

  const [neighbour] = await db
    .select()
    .from(rentals)
    .where(
      direction === "up"
        ? lt(rentals.sortOrder, current.sortOrder)
        : gt(rentals.sortOrder, current.sortOrder),
    )
    .orderBy(direction === "up" ? sql`${rentals.sortOrder} desc` : sql`${rentals.sortOrder} asc`)
    .limit(1);
  if (!neighbour) return;

  await db.update(rentals).set({ sortOrder: neighbour.sortOrder }).where(eq(rentals.id, current.id));
  await db.update(rentals).set({ sortOrder: current.sortOrder }).where(eq(rentals.id, neighbour.id));
  revalidateTag(contentTags.rentals);
  revalidatePath("/rentals");
}
