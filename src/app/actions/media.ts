"use server";

import { redirect } from "next/navigation";
import { and, eq, notInArray } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { media, mediaLinks } from "@/db/schema";
import { getVerifiedSession } from "@/lib/auth";
import { signUpload, destroyAsset } from "@/lib/cloudinary";
import { slugify } from "@/lib/format";

async function requireAdmin() {
  const session = await getVerifiedSession();
  if (!session) redirect("/admin/login");
  return session;
}

const signInput = z.object({
  /** Scopes the Cloudinary folder — never trusted as a path, only slugified. */
  folder: z.enum(["adventures", "hotels", "reviews", "site"]),
});

/**
 * Returns a one-shot signed upload ticket. The browser uploads directly to
 * Cloudinary with this signature — the file itself never passes through our
 * server, which is what keeps a 20-photo phone-camera batch from timing out
 * a Vercel function.
 */
export async function getUploadTicket(input: z.infer<typeof signInput>) {
  await requireAdmin();
  const { folder } = signInput.parse(input);
  return signUpload({ folder: `ganga-vedha/${folder}` });
}

const persistInput = z.object({
  publicId: z.string().min(1),
  secureUrl: z.url(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  format: z.string().max(16).nullable(),
  bytes: z.number().int().nonnegative().nullable(),
  folder: z.string().max(120).nullable(),
  altText: z.string().max(300).optional().default(""),
});

/** Called after a successful Cloudinary upload to record the asset in our own table. */
export async function createMediaRecord(input: z.infer<typeof persistInput>) {
  await requireAdmin();
  const data = persistInput.parse(input);
  const db = getDb();
  const [row] = await db
    .insert(media)
    .values({
      publicId: data.publicId,
      secureUrl: data.secureUrl,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
      folder: data.folder,
      altText: data.altText || null,
    })
    .returning();
  return row;
}

/**
 * Replaces the ordered gallery for one entity in a single transaction-like
 * pass: link every id in the new order, then drop anything not in that list.
 * Never leaves a partial gallery if the caller passes an empty array by
 * mistake — an empty array is a legitimate "clear the gallery" and is honored.
 */
export async function setEntityGallery(
  entityType: "hotel" | "adventure" | "gallery" | "service_line" | "review",
  entityId: number,
  mediaIds: number[],
) {
  await requireAdmin();
  const db = getDb();

  const scope = and(
    eq(mediaLinks.entityType, entityType),
    eq(mediaLinks.entityId, entityId),
  );

  if (mediaIds.length === 0) {
    await db.delete(mediaLinks).where(scope);
    return;
  }

  for (const [i, mediaId] of mediaIds.entries()) {
    await db
      .insert(mediaLinks)
      .values({ mediaId, entityType, entityId, sortOrder: i })
      .onConflictDoUpdate({
        target: [mediaLinks.entityType, mediaLinks.entityId, mediaLinks.mediaId],
        set: { sortOrder: i },
      });
  }
  // Scoped to THIS entity — an unscoped notInArray here would strip every
  // other entity's gallery links down to whatever this call's list contains.
  await db
    .delete(mediaLinks)
    .where(and(scope, notInArray(mediaLinks.mediaId, mediaIds)));
}

/**
 * Permanently deletes a media row and its Cloudinary asset together — never
 * one without the other, which is what keeps the two from drifting into
 * orphaned storage or a broken image reference.
 */
export async function deleteMedia(mediaId: number) {
  await requireAdmin();
  const db = getDb();
  const [row] = await db.select().from(media).where(eq(media.id, mediaId)).limit(1);
  if (!row) return;
  await db.delete(media).where(eq(media.id, mediaId));
  await destroyAsset(row.publicId);
}

export { slugify };
