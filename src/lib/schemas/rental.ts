import { z } from "zod";

const faqSchema = z.object({
  q: z.string().trim().min(1, "Question can't be empty."),
  a: z.string().trim().min(1, "Answer can't be empty."),
});

export const rentalSchema = z
  .object({
    kind: z.enum(["car", "bike"]),
    name: z.string().trim().min(3, "Give it a name.").max(160),
    slug: z
      .string()
      .trim()
      .min(3, "Slug is too short.")
      .max(100)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only."),

    quoteOnly: z.coerce.boolean(),
    perDayInr: z.coerce.number().int().nonnegative().max(1_000_000).nullable(),
    depositInr: z.coerce.number().int().nonnegative().max(1_000_000).nullable(),

    seats: z.coerce.number().int().positive().max(60).nullable(),
    transmission: z.string().trim().max(60).nullable(),
    fuelNote: z.string().trim().max(100).nullable(),

    summary: z.string().trim().min(1, "Write a one-line summary.").max(400),
    description: z.string().trim().min(1, "Write a description.").max(4000),

    includes: z.array(z.string().trim().min(1)).max(20),
    documentsRequired: z.array(z.string().trim().min(1)).max(20),
    terms: z.array(z.string().trim().min(1)).max(30),
    pickupNote: z.string().trim().max(1000).nullable(),
    faqs: z.array(faqSchema).max(20),

    coverMediaId: z.coerce.number().int().positive().nullable(),
    isPublished: z.coerce.boolean(),
  })
  .refine((v) => v.quoteOnly || v.perDayInr !== null, {
    message: "Set a per-day price, or mark it quote-only.",
    path: ["perDayInr"],
  });

export type RentalFormValues = z.infer<typeof rentalSchema>;
