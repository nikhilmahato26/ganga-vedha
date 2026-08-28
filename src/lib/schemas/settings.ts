import { z } from "zod";

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
  announcement: z.string().trim().max(300).nullable(),
  announcementActive: z.coerce.boolean(),
  riverStatusLabel: z.string().trim().min(1).max(60),
  gaugeLocation: z.string().trim().min(1).max(60),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
