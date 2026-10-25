"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { contentBlocks } from "@/db/schema";
import { getVerifiedSession } from "@/lib/auth";
import { contentTags } from "@/lib/content";
import { logAudit } from "@/lib/audit";
import { heroRoomsBlockSchema, whyUsBlockSchema } from "@/lib/schemas/content-block";
import { HERO_ROOMS_KEY } from "@/lib/hero-rooms";

export type ContentBlockActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

export async function updateWhyUsBlock(input: unknown): Promise<ContentBlockActionState> {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");

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
      .set({ title: data.title, subtitle: data.subtitle, items: data.items, updatedAt: new Date() })
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

  revalidateTag(contentTags.content);
  revalidateTag("content-block:why-choose-us");
  revalidatePath("/");
  await logAudit(session, { action: "update", entityType: "content_block", label: '"Why book with us" section' });
  return { ok: true };
}

export async function updateHeroRoomsBlock(input: unknown): Promise<ContentBlockActionState> {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");

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
    .onConflictDoUpdate({ target: contentBlocks.key, set: { items, updatedAt: new Date() } });

  revalidateTag(contentTags.content);
  revalidateTag(`content-block:${HERO_ROOMS_KEY}`);
  revalidatePath("/");
  await logAudit(session, { action: "update", entityType: "content_block", label: "Homepage rooms" });
  return { ok: true };
}
