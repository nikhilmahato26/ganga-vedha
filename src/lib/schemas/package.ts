import { z } from "zod";

const faqSchema = z.object({
  q: z.string().trim().min(1, "Question can't be empty."),
  a: z.string().trim().min(1, "Answer can't be empty."),
});

const itinerarySchema = z.object({
  title: z.string().trim().min(1, "Give the day a title.").max(80),
  detail: z.string().trim().min(1, "Add some detail.").max(1000),
});

export const packageSchema = z
  .object({
    name: z.string().trim().min(3, "Give it a name.").max(160),
    slug: z
      .string()
      .trim()
      .min(3, "Slug is too short.")
      .max(100)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only."),
    category: z.string().trim().max(60).nullable(),
    destinationId: z.coerce.number().int().positive().nullable(),

    durationLabel: z.string().trim().max(60).nullable(),
    nights: z.coerce.number().int().nonnegative().max(60).nullable(),
    routeLabel: z.string().trim().max(200).nullable(),

    priceInr: z.coerce.number().int().nonnegative().max(10_000_000),
    compareAtPriceInr: z.coerce.number().int().positive().max(10_000_000).nullable(),
    priceNote: z.string().trim().max(80).nullable(),

    rating: z.coerce.number().min(0).max(5).nullable(),
    reviewCount: z.coerce.number().int().nonnegative().nullable(),
    badge: z.string().trim().max(40).nullable(),

    summary: z.string().trim().min(1, "Write a one-line summary.").max(400),
    description: z.string().trim().min(1, "Write a description.").max(4000),

    itinerary: z.array(itinerarySchema).max(40),
    inclusions: z.array(z.string().trim().min(1)).max(40),
    exclusions: z.array(z.string().trim().min(1)).max(40),
    accommodationNote: z.string().trim().max(1000).nullable(),
    transportNote: z.string().trim().max(1000).nullable(),
    mealsNote: z.string().trim().max(1000).nullable(),
    terms: z.array(z.string().trim().min(1)).max(30),
    faqs: z.array(faqSchema).max(20),

    coverMediaId: z.coerce.number().int().positive().nullable(),
    isPublished: z.coerce.boolean(),
  })
  .refine(
    (v) => v.compareAtPriceInr === null || v.compareAtPriceInr > v.priceInr,
    {
      message: "The struck-through price must be higher than the real price.",
      path: ["compareAtPriceInr"],
    },
  );

export type PackageFormValues = z.infer<typeof packageSchema>;
export type PackageItineraryValues = z.infer<typeof itinerarySchema>;
