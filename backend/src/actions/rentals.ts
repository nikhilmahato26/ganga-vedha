import type { Admin } from "../lib/auth";
import type { ValidationError } from "../lib/http";
import type { RentalActionState } from "../../../frontend/src/lib/action-types";
import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import { getDb } from "../db";
import { rentals } from "../schema";
import { logAudit } from "../lib/audit";
import { rentalSchema, type RentalFormValues } from "../../../frontend/src/lib/schemas/rental";




function zodErrorState(err: ValidationError): RentalActionState {
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

export async function createRental(admin: Admin, input: unknown): Promise<RentalActionState> {
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

  await logAudit(admin, { action: "create", entityType: "rental", entityId: row.id, label: data.name });
  return { ok: true, id: row.id };
}

export async function updateRental(admin: Admin, id: number, input: unknown): Promise<RentalActionState> {
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
  await logAudit(admin, { action: "update", entityType: "rental", entityId: id, label: data.name });
  return { ok: true, id };
}

export async function deleteRental(admin: Admin, id: number) {
  const db = getDb();
  const [row] = await db
    .select({ slug: rentals.slug, name: rentals.name })
    .from(rentals)
    .where(eq(rentals.id, id))
    .limit(1);
  if (!row) return;
  await db.delete(rentals).where(eq(rentals.id, id));
  await logAudit(admin, { action: "delete", entityType: "rental", entityId: id, label: row.name });
}

export async function setRentalPublished(admin: Admin, id: number, isPublished: boolean) {
  const db = getDb();
  const [row] = await db
    .update(rentals)
    .set({ isPublished })
    .where(eq(rentals.id, id))
    .returning({ slug: rentals.slug, name: rentals.name });
  if (row) {
    await logAudit(admin, {
      action: isPublished ? "publish" : "unpublish",
      entityType: "rental",
      entityId: id,
      label: row.name,
    });
  }
}

export async function moveRental(_admin: Admin, id: number, direction: "up" | "down") {
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
}
