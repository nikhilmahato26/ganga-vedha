import { z } from "zod";

export const galleryItemSchema = z.object({
  mediaId: z.coerce.number().int().positive(),
  category: z.enum(["hotel", "rafting", "bungee"]).nullable(),
  caption: z.string().trim().max(200).nullable(),
  isPublished: z.coerce.boolean(),
});

export type GalleryItemFormValues = z.infer<typeof galleryItemSchema>;
