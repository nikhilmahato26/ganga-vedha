"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { closures } from "@/db/schema";
import type { ServiceKey } from "@/lib/content";
import { getVerifiedSession } from "@/lib/auth";
import { contentTags } from "@/lib/content";
import { logAudit } from "@/lib/audit";
import { closureMessageSchema, customClosureSchema } from "@/lib/schemas/closure";

async function requireAdmin() {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");
  return session;
}

function revalidateClosures() {
  revalidateTag(contentTags.closures);
  // The status strap and the interstitial render from the shared (site)
  // layout on every route, so a layout-scoped invalidation is what actually
  // guarantees every page picks up the change on the next request.
  revalidatePath("/", "layout");
}

const DEFAULT_MESSAGE: Record<ServiceKey, { title: string; body: string; footnote: string }> = {
  rafting: {
    title: "Rafting paused from mid-September",
    body: "Due to monsoon rains and high water levels on the Ganga, river rafting in Rishikesh is temporarily stopped for safety.",
    footnote: "Bookings reopen after the rains ease",
  },
  hotel: {
    title: "Hotel bookings paused",
    body: "We're not taking new hotel bookings right now. Message us on WhatsApp and we'll let you know when we reopen.",
    footnote: "Bookings reopen shortly",
  },
  bungee: {
    title: "Bungee jumping paused",
    body: "The bungee platform is closed for safety right now. Message us on WhatsApp and we'll let you know when we reopen.",
    footnote: "Bookings reopen shortly",
  },
};

export type ServiceClosure = {
  id: number | null;
  serviceKey: ServiceKey;
  isActive: boolean;
  icon: "rain" | "wrench" | "calendar" | "alert";
  title: string;
  body: string;
  footnote: string | null;
  ctaLabel: string;
  version: number;
};

/** Always all three services, even when no row exists yet — the switch must render before anyone has touched it. */
export async function listServiceClosures(): Promise<ServiceClosure[]> {
  const rows = await getDb().select().from(closures).where(eq(closures.scope, "service"));
  const byKey = new Map(rows.map((r) => [r.serviceKey, r]));

  return (["rafting", "bungee", "hotel"] as const).map((key) => {
    const row = byKey.get(key);
    if (row) {
      return {
        id: row.id,
        serviceKey: key,
        isActive: row.isActive,
        icon: row.icon,
        title: row.title,
        body: row.body,
        footnote: row.footnote,
        ctaLabel: row.ctaLabel,
        version: row.version,
      };
    }
    const d = DEFAULT_MESSAGE[key];
    return {
      id: null,
      serviceKey: key,
      isActive: false,
      icon: "rain",
      title: d.title,
      body: d.body,
      footnote: d.footnote,
      ctaLabel: "Got it",
      version: 1,
    };
  });
}

/**
 * The monsoon switch. Turning it on when no row exists yet creates one with
 * sensible default copy, so the owner never has to write a message before the
 * switch works — turning it off never deletes the row, so next season's
 * message is right where they left it.
 */
export async function setServiceClosureActive(serviceKey: ServiceKey, isActive: boolean) {
  const session = await requireAdmin();
  const db = getDb();

  const [existing] = await db
    .select()
    .from(closures)
    .where(and(eq(closures.scope, "service"), eq(closures.serviceKey, serviceKey)))
    .limit(1);

  if (existing) {
    await db.update(closures).set({ isActive }).where(eq(closures.id, existing.id));
  } else if (isActive) {
    const d = DEFAULT_MESSAGE[serviceKey];
    await db.insert(closures).values({
      scope: "service",
      serviceKey,
      isActive: true,
      icon: "rain",
      title: d.title,
      body: d.body,
      footnote: d.footnote,
      ctaLabel: "Got it",
    });
  }
  // isActive=false with no existing row: nothing to deactivate.

  revalidateClosures();
  await logAudit(session, {
    action: isActive ? "unpublish" : "publish", // closing bookings is the "restrictive" state
    entityType: "closure",
    label: `${serviceKey} bookings ${isActive ? "closed" : "opened"}`,
  });
}

export type ClosureActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

/**
 * Saving a message bumps `version`, which is what brings the notice back for
 * a visitor who already dismissed the previous wording — dismissal is keyed
 * to closureId:version, so an untouched version number would leave the new
 * copy silently unseen by anyone who saw the old one.
 */
export async function updateServiceClosureMessage(
  serviceKey: ServiceKey,
  input: unknown,
): Promise<ClosureActionState> {
  const session = await requireAdmin();
  const parsed = closureMessageSchema.safeParse(input);
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

  const [existing] = await db
    .select({ id: closures.id, version: closures.version })
    .from(closures)
    .where(and(eq(closures.scope, "service"), eq(closures.serviceKey, serviceKey)))
    .limit(1);

  if (existing) {
    await db
      .update(closures)
      .set({ ...data, version: existing.version + 1 })
      .where(eq(closures.id, existing.id));
  } else {
    await db.insert(closures).values({
      scope: "service",
      serviceKey,
      isActive: false,
      ...data,
    });
  }

  revalidateClosures();
  await logAudit(session, {
    action: "update",
    entityType: "closure",
    label: `${serviceKey} closure message: "${data.title}"`,
  });
  return { ok: true };
}

export type CustomClosureActionState =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

/**
 * A closure the owner sets up for a specific reason — one hotel under
 * renovation, one rafting stretch shut for a landslide — rather than the
 * three fixed whole-service switches above. Every reader (`resolveClosure`)
 * already understands `scope: "entity"` and `scope: "global"`; this is the
 * only piece that was missing — a way to create one at all.
 */
export async function createClosure(input: unknown): Promise<CustomClosureActionState> {
  const session = await requireAdmin();
  const parsed = customClosureSchema.safeParse(input);
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

  await db.insert(closures).values({
    scope: data.scope,
    entityType: data.scope === "entity" ? data.entityType : null,
    entityId: data.scope === "entity" ? data.entityId : null,
    isActive: data.isActive,
    icon: data.icon,
    title: data.title,
    body: data.body,
    footnote: data.footnote,
    ctaLabel: data.ctaLabel,
  });

  revalidateClosures();
  await logAudit(session, {
    action: "create",
    entityType: "closure",
    label: `Closure created: "${data.title}"`,
  });
  return { ok: true };
}

export async function updateClosure(id: number, input: unknown): Promise<CustomClosureActionState> {
  const session = await requireAdmin();
  const parsed = customClosureSchema.safeParse(input);
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

  const [existing] = await db.select({ version: closures.version }).from(closures).where(eq(closures.id, id)).limit(1);
  if (!existing) return { ok: false, error: "This closure no longer exists." };

  await db
    .update(closures)
    .set({
      scope: data.scope,
      entityType: data.scope === "entity" ? data.entityType : null,
      entityId: data.scope === "entity" ? data.entityId : null,
      isActive: data.isActive,
      icon: data.icon,
      title: data.title,
      body: data.body,
      footnote: data.footnote,
      ctaLabel: data.ctaLabel,
      version: existing.version + 1,
    })
    .where(eq(closures.id, id));

  revalidateClosures();
  await logAudit(session, {
    action: "update",
    entityType: "closure",
    entityId: id,
    label: `Closure updated: "${data.title}"`,
  });
  return { ok: true };
}

export async function setClosureActive(id: number, isActive: boolean) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db.select({ title: closures.title }).from(closures).where(eq(closures.id, id)).limit(1);
  if (!row) return;

  await db.update(closures).set({ isActive }).where(eq(closures.id, id));

  revalidateClosures();
  await logAudit(session, {
    action: isActive ? "unpublish" : "publish",
    entityType: "closure",
    entityId: id,
    label: `"${row.title}" ${isActive ? "closed" : "opened"}`,
  });
}

export async function deleteClosure(id: number) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db.select({ title: closures.title }).from(closures).where(eq(closures.id, id)).limit(1);
  if (!row) return;

  await db.delete(closures).where(eq(closures.id, id));

  revalidateClosures();
  await logAudit(session, {
    action: "delete",
    entityType: "closure",
    entityId: id,
    label: `Closure deleted: "${row.title}"`,
  });
}
