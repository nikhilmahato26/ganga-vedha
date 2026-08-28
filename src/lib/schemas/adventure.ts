import { z } from "zod";

/**
 * Shared by the admin form (client-side feedback) and the server action
 * (the actual gate). One object, so a rule enforced in the browser can never
 * quietly diverge from the rule the database sees.
 */

const faqSchema = z.object({
  q: z.string().trim().min(1, "Question can't be empty."),
  a: z.string().trim().min(1, "Answer can't be empty."),
});

/** Textarea input, one item per line — trimmed, blank lines dropped. */
export function parseLines(raw: string): string[] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export const adventureSchema = z
  .object({
    kind: z.enum(["rafting", "bungee"]),
    name: z.string().trim().min(3, "Give it a name.").max(160),
    slug: z
      .string()
      .trim()
      .min(3, "Slug is too short.")
      .max(100)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only."),

    distanceKm: z.coerce.number().positive().max(999.9).nullable(),
    heightM: z.coerce.number().int().positive().max(999).nullable(),
    putInPoint: z.string().trim().max(120).nullable(),
    grade: z.enum(["easy", "moderate", "challenging"]).nullable(),
    durationMinutes: z.coerce.number().int().positive().max(1440),

    priceInr: z.coerce.number().int().nonnegative().max(1_000_000),
    compareAtPriceInr: z.coerce.number().int().positive().max(1_000_000).nullable(),

    rating: z.coerce.number().min(0).max(5).nullable(),
    reviewCount: z.coerce.number().int().nonnegative().nullable(),
    badge: z.string().trim().max(40).nullable(),
    bestFor: z.string().trim().max(60).nullable(),

    summary: z.string().trim().min(1, "Write a one-line summary.").max(400),
    description: z.string().trim().min(1, "Write a description.").max(4000),

    inclusions: z.array(z.string().trim().min(1)).max(30),
    exclusions: z.array(z.string().trim().min(1)).max(30),
    whatToBring: z.array(z.string().trim().min(1)).max(30),
    rapids: z.array(z.string().trim().min(1)).max(20),
    faqs: z.array(faqSchema).max(20),

    meetingPoint: z.string().trim().max(2000).nullable(),
    minAge: z.coerce.number().int().nonnegative().max(120).nullable(),
    minWeightKg: z.coerce.number().int().positive().max(400).nullable(),
    maxWeightKg: z.coerce.number().int().positive().max(400).nullable(),

    coverMediaId: z.coerce.number().int().positive().nullable(),
    isPublished: z.coerce.boolean(),
  })
  .refine((v) => v.kind !== "rafting" || v.distanceKm !== null, {
    message: "Rafting stretches need a distance.",
    path: ["distanceKm"],
  })
  .refine((v) => v.kind !== "bungee" || v.heightM !== null, {
    message: "Bungee packages need a height.",
    path: ["heightM"],
  })
  .refine(
    (v) => v.compareAtPriceInr === null || v.compareAtPriceInr > v.priceInr,
    { message: "The struck-through price must be higher than the real price.", path: ["compareAtPriceInr"] },
  )
  .refine(
    (v) => v.minWeightKg === null || v.maxWeightKg === null || v.maxWeightKg >= v.minWeightKg,
    { message: "Max weight can't be less than min weight.", path: ["maxWeightKg"] },
  );

export type AdventureFormValues = z.infer<typeof adventureSchema>;
