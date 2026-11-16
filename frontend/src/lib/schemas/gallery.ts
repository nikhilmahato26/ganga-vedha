import { z } from "zod";

export const galleryItemSchema = z.object({
  mediaId: z.coerce.number().int().positive(),
  category: z.enum(["hotel", "rafting", "bungee"]).nullable(),
  /** Free-text album name — "Rafting", "Mountains", "Manali"… */
  album: z.string().trim().max(80).nullable(),
  caption: z.string().trim().max(200).nullable(),
  isPublished: z.coerce.boolean(),
});

export type GalleryItemFormValues = z.infer<typeof galleryItemSchema>;
