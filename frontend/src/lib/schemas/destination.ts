import { z } from "zod";

const faqSchema = z.object({
  q: z.string().trim().min(1, "Question can't be empty."),
  a: z.string().trim().min(1, "Answer can't be empty."),
});

export const destinationSchema = z.object({
  name: z.string().trim().min(2, "Give it a name.").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is too short.")
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only."),
  region: z.string().trim().max(80).nullable(),
  tagline: z.string().trim().max(200).nullable(),
  intro: z.string().trim().min(1, "Write a short introduction.").max(4000),
  highlights: z.array(z.string().trim().min(1)).max(20),
  bestTime: z.string().trim().max(160).nullable(),
  howToReach: z.string().trim().max(1000).nullable(),
  faqs: z.array(faqSchema).max(20),

  coverMediaId: z.coerce.number().int().positive().nullable(),
  isPublished: z.coerce.boolean(),
});

export type DestinationFormValues = z.infer<typeof destinationSchema>;
