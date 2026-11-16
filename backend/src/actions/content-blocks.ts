import type { Admin } from "../lib/auth";
import type { ContentBlockActionState } from "../../../frontend/src/lib/action-types";
import { eq } from "drizzle-orm";
import { getDb, nowIso } from "../db";
import { contentBlocks } from "../schema";
import { logAudit } from "../lib/audit";
import { heroRoomsBlockSchema, whyUsBlockSchema } from "../../../frontend/src/lib/schemas/content-block";
import { HERO_ROOMS_KEY } from "../../../frontend/src/lib/hero-rooms";


export async function updateWhyUsBlock(admin: Admin, input: unknown): Promise<ContentBlockActionState> {

  const parsed = whyUsBlockSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Check the highlighted fields.", fieldErrors };
  }
  const data = parsed.data;
  const db = getDb();

  const existing = await db
    .select({ id: contentBlocks.id })
    .from(contentBlocks)
    .where(eq(contentBlocks.key, "why-choose-us"))
    .limit(1);

  if (existing.length) {
    await db
      .update(contentBlocks)
      .set({ title: data.title, subtitle: data.subtitle, items: data.items, updatedAt: nowIso() })
      .where(eq(contentBlocks.key, "why-choose-us"));
  } else {
    await db.insert(contentBlocks).values({
      key: "why-choose-us",
      title: data.title,
      subtitle: data.subtitle,
      items: data.items,
      isActive: true,
      sortOrder: 1,
    });
  }

  await logAudit(admin, { action: "update", entityType: "content_block", label: '"Why book with us" section' });
  return { ok: true };
}

export async function updateHeroRoomsBlock(admin: Admin, input: unknown): Promise<ContentBlockActionState> {

  const parsed = heroRoomsBlockSchema.safeParse(input);
  if (!parsed.success) {
    // Keyed by the full path ("items.2.priceInr") so the editor can mark the
    // exact room row, not just the list.
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Check the highlighted rooms.", fieldErrors };
  }
  const { items } = parsed.data;
  const db = getDb();

  await db
    .insert(contentBlocks)
    .values({ key: HERO_ROOMS_KEY, title: "Homepage rooms", items, isActive: true })
    .onConflictDoUpdate({ target: contentBlocks.key, set: { items, updatedAt: nowIso() } });

  await logAudit(admin, { action: "update", entityType: "content_block", label: "Homepage rooms" });
  return { ok: true };
}
