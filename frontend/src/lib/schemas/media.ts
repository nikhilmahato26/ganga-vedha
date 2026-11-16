import { z } from "zod";

/** Asking the API for a one-time signed Cloudinary upload ticket. */
export const uploadTicketSchema = z.object({
  /** Scopes the Cloudinary folder (`ganga-vedha/<folder>`); a closed list, never a free path. */
  folder: z.enum([
    "adventures",
    "hotels",
    "reviews",
    "site",
    "packages",
    "rentals",
    "destinations",
    "hero",
    "promotions",
  ]),
});

/** Recording an image in the media table after Cloudinary accepted the upload. */
export const mediaRecordSchema = z.object({
  publicId: z.string().min(1),
  secureUrl: z.url(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  format: z.string().max(16).nullable(),
  bytes: z.number().int().nonnegative().nullable(),
  folder: z.string().max(120).nullable(),
  altText: z.string().max(300).optional().default(""),
});

export type UploadFolder = z.infer<typeof uploadTicketSchema>["folder"];
export type MediaRecordInput = z.input<typeof mediaRecordSchema>;
