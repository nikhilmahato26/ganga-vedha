"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq, gt, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { reviews } from "@/db/schema";
import { getVerifiedSession } from "@/lib/auth";
import { contentTags } from "@/lib/content";
import { logAudit } from "@/lib/audit";
import { reviewSchema } from "@/lib/schemas/review";

async function requireAdmin() {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");
  return session;
}

function revalidateReviews() {
  revalidateTag(contentTags.reviews);
  revalidatePath("/");
}

export type ReviewActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

function zodErrorState(err: import("zod").ZodError): ReviewActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Check the highlighted fields.", fieldErrors };
}

export async function createReview(input: unknown): Promise<ReviewActionState> {
  const session = await requireAdmin();
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

  revalidateReviews();
  await logAudit(session, {
    action: "create",
    entityType: "review",
    entityId: row.id,
    label: parsed.data.authorName,
  });
  return { ok: true, id: row.id };
}

export async function updateReview(id: number, input: unknown): Promise<ReviewActionState> {
  const session = await requireAdmin();
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const db = getDb();

  await db.update(reviews).set(parsed.data).where(eq(reviews.id, id));
  revalidateReviews();
  await logAudit(session, {
    action: "update",
    entityType: "review",
    entityId: id,
    label: parsed.data.authorName,
  });
  return { ok: true, id };
}

export async function deleteReview(id: number) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ authorName: reviews.authorName })
    .from(reviews)
    .where(eq(reviews.id, id))
    .limit(1);
  await db.delete(reviews).where(eq(reviews.id, id));
  revalidateReviews();
  if (row) {
    await logAudit(session, { action: "delete", entityType: "review", entityId: id, label: row.authorName });
  }
}

export async function setReviewPublished(id: number, isPublished: boolean) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .update(reviews)
    .set({ isPublished })
    .where(eq(reviews.id, id))
    .returning({ authorName: reviews.authorName });
  revalidateReviews();
  if (row) {
    await logAudit(session, {
      action: isPublished ? "publish" : "unpublish",
      entityType: "review",
      entityId: id,
      label: row.authorName,
    });
  }
}

export async function moveReview(id: number, direction: "up" | "down") {
  await requireAdmin();
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
  revalidateReviews();
}
