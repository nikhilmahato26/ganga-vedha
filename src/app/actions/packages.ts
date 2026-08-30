"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { packages } from "@/db/schema";
import { getVerifiedSession } from "@/lib/auth";
import { contentTags } from "@/lib/content";
import { logAudit } from "@/lib/audit";
import { packageSchema, type PackageFormValues } from "@/lib/schemas/package";

async function requireAdmin() {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");
  return session;
}

function revalidatePackagePaths(slug: string, prevSlug?: string) {
  revalidateTag(contentTags.packages);
  revalidateTag(`package:${slug}`);
  if (prevSlug && prevSlug !== slug) revalidateTag(`package:${prevSlug}`);
  revalidatePath("/packages");
  revalidatePath(`/packages/${slug}`);
  // Destination pages list the packages that visit them.
  revalidatePath("/stays/[slug]", "page");
  if (prevSlug && prevSlug !== slug) revalidatePath(`/packages/${prevSlug}`);
}

export type PackageActionState =
  | { ok: true; id: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> }
  | undefined;

function zodErrorState(err: import("zod").ZodError): PackageActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Check the highlighted fields.", fieldErrors };
}

function toShape(data: PackageFormValues) {
  return {
    name: data.name,
    slug: data.slug,
    category: data.category,
    destinationId: data.destinationId,
    durationLabel: data.durationLabel,
    nights: data.nights,
    routeLabel: data.routeLabel,
    priceInr: data.priceInr,
    compareAtPriceInr: data.compareAtPriceInr,
    priceNote: data.priceNote,
    rating: data.rating === null ? null : String(data.rating),
    reviewCount: data.reviewCount,
    badge: data.badge,
    summary: data.summary,
    description: data.description,
    itinerary: data.itinerary,
    inclusions: data.inclusions,
    exclusions: data.exclusions,
    accommodationNote: data.accommodationNote,
    transportNote: data.transportNote,
    mealsNote: data.mealsNote,
    terms: data.terms,
    faqs: data.faqs,
    coverMediaId: data.coverMediaId,
    isPublished: data.isPublished,
  };
}

export async function createPackage(input: unknown): Promise<PackageActionState> {
  const session = await requireAdmin();
  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const data = parsed.data;

  const db = getDb();
  const dup = await db
    .select({ id: packages.id })
    .from(packages)
    .where(eq(packages.slug, data.slug))
    .limit(1);
  if (dup.length) {
    return { ok: false, error: "That slug is already used.", fieldErrors: { slug: "Already taken." } };
  }

  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${packages.sortOrder}), 0)` })
    .from(packages);

  const [row] = await db
    .insert(packages)
    .values({ ...toShape(data), sortOrder: max + 1 })
    .returning({ id: packages.id });

  revalidatePackagePaths(data.slug);
  await logAudit(session, { action: "create", entityType: "package", entityId: row.id, label: data.name });
  return { ok: true, id: row.id };
}

export async function updatePackage(id: number, input: unknown): Promise<PackageActionState> {
  const session = await requireAdmin();
  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) return zodErrorState(parsed.error);
  const data = parsed.data;

  const db = getDb();
  const [existing] = await db
    .select({ slug: packages.slug })
    .from(packages)
    .where(eq(packages.id, id))
    .limit(1);
  if (!existing) return { ok: false, error: "That package no longer exists." };

  const dup = await db
    .select({ id: packages.id })
    .from(packages)
    .where(and(eq(packages.slug, data.slug), ne(packages.id, id)))
    .limit(1);
  if (dup.length) {
    return { ok: false, error: "That slug is already used.", fieldErrors: { slug: "Already taken." } };
  }

  await db.update(packages).set(toShape(data)).where(eq(packages.id, id));
  revalidatePackagePaths(data.slug, existing.slug);
  await logAudit(session, { action: "update", entityType: "package", entityId: id, label: data.name });
  return { ok: true, id };
}

export async function deletePackage(id: number) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .select({ slug: packages.slug, name: packages.name })
    .from(packages)
    .where(eq(packages.id, id))
    .limit(1);
  if (!row) return;
  await db.delete(packages).where(eq(packages.id, id));
  revalidatePackagePaths(row.slug);
  await logAudit(session, { action: "delete", entityType: "package", entityId: id, label: row.name });
}

export async function setPackagePublished(id: number, isPublished: boolean) {
  const session = await requireAdmin();
  const db = getDb();
  const [row] = await db
    .update(packages)
    .set({ isPublished })
    .where(eq(packages.id, id))
    .returning({ slug: packages.slug, name: packages.name });
  if (row) {
    revalidatePackagePaths(row.slug);
    await logAudit(session, {
      action: isPublished ? "publish" : "unpublish",
      entityType: "package",
      entityId: id,
      label: row.name,
    });
  }
}

export async function movePackage(id: number, direction: "up" | "down") {
  await requireAdmin();
  const db = getDb();
  const [current] = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  if (!current) return;

  const [neighbour] = await db
    .select()
    .from(packages)
    .where(
      direction === "up"
        ? lt(packages.sortOrder, current.sortOrder)
        : gt(packages.sortOrder, current.sortOrder),
    )
    .orderBy(direction === "up" ? sql`${packages.sortOrder} desc` : sql`${packages.sortOrder} asc`)
    .limit(1);
  if (!neighbour) return;

  await db.update(packages).set({ sortOrder: neighbour.sortOrder }).where(eq(packages.id, current.id));
  await db.update(packages).set({ sortOrder: current.sortOrder }).where(eq(packages.id, neighbour.id));
  revalidateTag(contentTags.packages);
  revalidatePath("/packages");
}
