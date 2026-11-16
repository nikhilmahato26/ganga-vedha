import type { Admin } from "../lib/auth";
import type { PromotionActionState } from "../../../frontend/src/lib/action-types";
import { eq, gt, lt, sql } from "drizzle-orm";
import { getDb, nowIso } from "../db";
import { promotions } from "../schema";
import { logAudit } from "../lib/audit";
import { promotionSchema, type PromotionFormValues } from "../../../frontend/src/lib/schemas/promotion";




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

export async function createPromotion(admin: Admin, input: unknown): Promise<PromotionActionState> {
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

  await logAudit(admin, {
    action: "create",
    entityType: "promotion",
    entityId: row.id,
    label: parsed.data.title,
  });
  return { ok: true, id: row.id };
}

export async function updatePromotion(admin: Admin, id: number, input: unknown): Promise<PromotionActionState> {
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
    .set({ ...toShape(parsed.data), updatedAt: nowIso() })
    .where(eq(promotions.id, id));
  await logAudit(admin, {
    action: "update",
    entityType: "promotion",
    entityId: id,
    label: parsed.data.title,
  });
  return { ok: true, id };
}

export async function deletePromotion(admin: Admin, id: number) {
  const db = getDb();
  const [row] = await db
    .select({ title: promotions.title })
    .from(promotions)
    .where(eq(promotions.id, id))
    .limit(1);
  if (!row) return;
  await db.delete(promotions).where(eq(promotions.id, id));
  await logAudit(admin, { action: "delete", entityType: "promotion", entityId: id, label: row.title });
}

export async function setPromotionActive(admin: Admin, id: number, isActive: boolean) {
  const db = getDb();
  const [row] = await db
    .update(promotions)
    .set({ isActive, updatedAt: nowIso() })
    .where(eq(promotions.id, id))
    .returning({ title: promotions.title });
  if (row) {
    await logAudit(admin, {
      action: isActive ? "publish" : "unpublish",
      entityType: "promotion",
      entityId: id,
      label: row.title,
    });
  }
}

export async function movePromotion(_admin: Admin, id: number, direction: "up" | "down") {
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
}
