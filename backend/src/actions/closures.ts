import type { Admin } from "../lib/auth";
import type { ServiceClosure, ClosureActionState, CustomClosureActionState } from "../../../frontend/src/lib/action-types";
import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { closures } from "../schema";
import type { ServiceKey } from "../../../frontend/src/lib/content-types";
import { logAudit } from "../lib/audit";
import { closureMessageSchema, customClosureSchema } from "../../../frontend/src/lib/schemas/closure";



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

/** Always all three services, even when no row exists yet — the switch must render before anyone has touched it. */
export async function listServiceClosures(_admin: Admin): Promise<ServiceClosure[]> {
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
export async function setServiceClosureActive(admin: Admin, serviceKey: ServiceKey, isActive: boolean) {
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

  await logAudit(admin, {
    action: isActive ? "unpublish" : "publish", // closing bookings is the "restrictive" state
    entityType: "closure",
    label: `${serviceKey} bookings ${isActive ? "closed" : "opened"}`,
  });
}


/**
 * Saving a message bumps `version`, which is what brings the notice back for
 * a visitor who already dismissed the previous wording — dismissal is keyed
 * to closureId:version, so an untouched version number would leave the new
 * copy silently unseen by anyone who saw the old one.
 */
export async function updateServiceClosureMessage(
  admin: Admin,
  serviceKey: ServiceKey,
  input: unknown,
): Promise<ClosureActionState> {
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

  await logAudit(admin, {
    action: "update",
    entityType: "closure",
    label: `${serviceKey} closure message: "${data.title}"`,
  });
  return { ok: true };
}


/**
 * A closure the owner sets up for a specific reason — one hotel under
 * renovation, one rafting stretch shut for a landslide — rather than the
 * three fixed whole-service switches above. Every reader (`resolveClosure`)
 * already understands `scope: "entity"` and `scope: "global"`; this is the
 * only piece that was missing — a way to create one at all.
 */
export async function createClosure(admin: Admin, input: unknown): Promise<CustomClosureActionState> {
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

  await logAudit(admin, {
    action: "create",
    entityType: "closure",
    label: `Closure created: "${data.title}"`,
  });
  return { ok: true };
}

export async function updateClosure(admin: Admin, id: number, input: unknown): Promise<CustomClosureActionState> {
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

  await logAudit(admin, {
    action: "update",
    entityType: "closure",
    entityId: id,
    label: `Closure updated: "${data.title}"`,
  });
  return { ok: true };
}

export async function setClosureActive(admin: Admin, id: number, isActive: boolean) {
  const db = getDb();
  const [row] = await db.select({ title: closures.title }).from(closures).where(eq(closures.id, id)).limit(1);
  if (!row) return;

  await db.update(closures).set({ isActive }).where(eq(closures.id, id));

  await logAudit(admin, {
    action: isActive ? "unpublish" : "publish",
    entityType: "closure",
    entityId: id,
    label: `"${row.title}" ${isActive ? "closed" : "opened"}`,
  });
}

export async function deleteClosure(admin: Admin, id: number) {
  const db = getDb();
  const [row] = await db.select({ title: closures.title }).from(closures).where(eq(closures.id, id)).limit(1);
  if (!row) return;

  await db.delete(closures).where(eq(closures.id, id));

  await logAudit(admin, {
    action: "delete",
    entityType: "closure",
    entityId: id,
    label: `Closure deleted: "${row.title}"`,
  });
}
