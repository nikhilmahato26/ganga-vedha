"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq, gt, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { promotions } from "@/db/schema";
import { getVerifiedSession } from "@/lib/auth";
import { contentTags } from "@/lib/content";
import { logAudit } from "@/lib/audit";
import { promotionSchema, type PromotionFormValues } from "@/lib/schemas/promotion";

async function requireAdmin() {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** Promotions render on the home page; that's the only place to revalidate. */
function revalidatePromos() {
  revalidateTag(contentTags.promotions);
  revalidatePath("/");
}

export type PromotionActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

function zodErrorState(err: import("zod").ZodError): PromotionActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Check the highlighted fields.", fieldErrors };
}

function toShape(data: PromotionFormValues) {
  return {
    title: data.title,
    body: data.body,
    ctaLabel: data.ctaLabel,
    ctaHref: data.ctaHref,
    mediaId: data.mediaId,
    isActive: data.isActive,
  };
}

export async function createPromotion(input: unknown): Promise<PromotionActionState> {
  const session = await requireAdmin();
  const parsed = promotionSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);

  const db = getDb();
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${promotions.sortOrder}), 0)` })
    .from(promotions);
  const [row] = await db
    .insert(promotions)
    .values({ ...toShape(parsed.data), sortOrder: max + 1 })
    .returning({ id: promotions.id });

  revalidatePromos();
  await logAudit(session, {
    action: "create",
    entityType: "promotion",
    entityId: row.id,
    label: parsed.data.title,
  });
  return { ok: true, id: row.id };
}

export async function updatePromotion(id: number, input: unknown): Promise<PromotionActionState> {
  const session = await requireAdmin();
  const parsed = promotionSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);

  const db = getDb();
  const [existing] = await db
    .select({ id: promotions.id })
    .from(promotions)
    .where(eq(promotions.id, id))
    .limit(1);
  if (!existing) return { ok: false, error: "That promotion no longer exists." };

  await db
    .update(promotions)
    .set({ ...toShape(parsed.data), updatedAt: new Date() })
    .where(eq(promotions.id, id));
  revalidatePromos();
  await logAudit(session, {
    action: "update",
    entityType: "promotion",
    entityId: id,
    label: parsed.data.title,
  });
  return { ok: true, id };
}

export async function deletePromotion(id: number) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ title: promotions.title })
    .from(promotions)
    .where(eq(promotions.id, id))
    .limit(1);
  if (!row) return;
  await db.delete(promotions).where(eq(promotions.id, id));
  revalidatePromos();
  await logAudit(session, { action: "delete", entityType: "promotion", entityId: id, label: row.title });
}

export async function setPromotionActive(id: number, isActive: boolean) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .update(promotions)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(promotions.id, id))
    .returning({ title: promotions.title });
  if (row) {
    revalidatePromos();
    await logAudit(session, {
      action: isActive ? "publish" : "unpublish",
      entityType: "promotion",
      entityId: id,
      label: row.title,
    });
  }
}

export async function movePromotion(id: number, direction: "up" | "down") {
  await requireAdmin();
  const db = getDb();
  const [current] = await db.select().from(promotions).where(eq(promotions.id, id)).limit(1);
  if (!current) return;

  const [neighbour] = await db
    .select()
    .from(promotions)
    .where(
      direction === "up"
        ? lt(promotions.sortOrder, current.sortOrder)
        : gt(promotions.sortOrder, current.sortOrder),
    )
    .orderBy(
      direction === "up" ? sql`${promotions.sortOrder} desc` : sql`${promotions.sortOrder} asc`,
    )
    .limit(1);
  if (!neighbour) return;

  await db
    .update(promotions)
    .set({ sortOrder: neighbour.sortOrder })
    .where(eq(promotions.id, current.id));
  await db
    .update(promotions)
    .set({ sortOrder: current.sortOrder })
    .where(eq(promotions.id, neighbour.id));
  revalidatePromos();
}
