import { z } from "zod";

/** An empty form field means "not set", not zero. */
const blankToNull = (v: unknown) => (v === "" || v === null || v === undefined ? null : v);

export const settingsSchema = z.object({
  brandName: z.string().trim().min(1, "Required.").max(120),
  tagline: z.string().trim().max(200).nullable(),
  whatsappNumber: z.string().trim().max(20),
  phone: z.string().trim().max(20),
  email: z.union([z.literal(""), z.email()]),
  address: z.string().trim().max(500),
  mapUrl: z.union([z.literal(""), z.url()]),
  heroHeading: z.string().trim().max(300),
  heroSubheading: z.string().trim().max(600),
  heroMediaId: z.coerce.number().int().positive().nullable(),
  announcement: z.string().trim().max(300).nullable(),
  announcementActive: z.coerce.boolean(),
  riverStatusLabel: z.string().trim().min(1).max(60),
  gaugeLocation: z.string().trim().min(1).max(60),
  googleReviewsUrl: z.union([z.literal(""), z.url("Paste the full link from Google, starting with https://")]),
  googleRating: z.preprocess(
    blankToNull,
    z.coerce.number().min(1, "Between 1 and 5.").max(5, "Between 1 and 5.").nullable(),
  ),
  googleReviewCount: z.preprocess(blankToNull, z.coerce.number().int().min(0, "Can't be negative.").nullable()),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
