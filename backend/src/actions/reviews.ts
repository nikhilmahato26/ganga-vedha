import type { Admin } from "../lib/auth";
import type { ReviewActionState } from "../../../frontend/src/lib/action-types";
import { eq, gt, lt, sql } from "drizzle-orm";
import { getDb } from "../db";
import { reviews } from "../schema";
import { logAudit } from "../lib/audit";
import { reviewSchema } from "../../../frontend/src/lib/schemas/review";




function zodErrorState(err: import("zod").ZodError): ReviewActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Check the highlighted fields.", fieldErrors };
}

export async function createReview(admin: Admin, input: unknown): Promise<ReviewActionState> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const db = getDb();

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${reviews.sortOrder}), 0)` })
    .from(reviews);

  const [row] = await db
    .insert(reviews)
    .values({ ...parsed.data, source: "manual", sortOrder: max + 1 })
    .returning({ id: reviews.id });

  await logAudit(admin, {
    action: "create",
    entityType: "review",
    entityId: row.id,
    label: parsed.data.authorName,
  });
  return { ok: true, id: row.id };
}

export async function updateReview(admin: Admin, id: number, input: unknown): Promise<ReviewActionState> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const db = getDb();

  await db.update(reviews).set(parsed.data).where(eq(reviews.id, id));
  await logAudit(admin, {
    action: "update",
    entityType: "review",
    entityId: id,
    label: parsed.data.authorName,
  });
  return { ok: true, id };
}

export async function deleteReview(admin: Admin, id: number) {
  const db = getDb();
  const [row] = await db
    .select({ authorName: reviews.authorName })
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1);
  await db.delete(reviews).where(eq(reviews.id, id));
  if (row) {
    await logAudit(admin, { action: "delete", entityType: "review", entityId: id, label: row.authorName });
  }
}

export async function setReviewPublished(admin: Admin, id: number, isPublished: boolean) {
  const db = getDb();
  const [row] = await db
    .update(reviews)
    .set({ isPublished })
    .where(eq(reviews.id, id))
    .returning({ authorName: reviews.authorName });
  if (row) {
    await logAudit(admin, {
      action: isPublished ? "publish" : "unpublish",
      entityType: "review",
      entityId: id,
      label: row.authorName,
    });
  }
}

export async function moveReview(_admin: Admin, id: number, direction: "up" | "down") {
  const db = getDb();
  const [current] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  if (!current) return;

  const [neighbour] = await db
    .select()
    .from(reviews)
    .where(
      direction === "up"
        ? lt(reviews.sortOrder, current.sortOrder)
        : gt(reviews.sortOrder, current.sortOrder),
    )
    .orderBy(direction === "up" ? sql`${reviews.sortOrder} desc` : sql`${reviews.sortOrder} asc`)
    .limit(1);
  if (!neighbour) return;

  await db.update(reviews).set({ sortOrder: neighbour.sortOrder }).where(eq(reviews.id, current.id));
  await db.update(reviews).set({ sortOrder: current.sortOrder }).where(eq(reviews.id, neighbour.id));
}
