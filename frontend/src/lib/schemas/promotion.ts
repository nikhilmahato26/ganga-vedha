import { z } from "zod";

export const promotionSchema = z
  .object({
    title: z.string().trim().min(2, "Give it a title.").max(120),
    body: z.string().trim().max(300).nullable(),
    ctaLabel: z.string().trim().max(32).nullable(),
    ctaHref: z.string().trim().max(300).nullable(),
    mediaId: z.coerce.number().int().positive().nullable(),
    isActive: z.coerce.boolean(),
  })
  .refine((v) => !v.ctaLabel || !!v.ctaHref, {
    message: "Add the link the button should open.",
    path: ["ctaHref"],
  })
  .refine((v) => !v.ctaHref || !!v.ctaLabel, {
    message: "Add the text for the button.",
    path: ["ctaLabel"],
  });

export type PromotionFormValues = z.infer<typeof promotionSchema>;
