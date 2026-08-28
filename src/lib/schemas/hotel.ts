import { z } from "zod";

const faqSchema = z.object({
  q: z.string().trim().min(1, "Question can't be empty."),
  a: z.string().trim().min(1, "Answer can't be empty."),
});

const roomSchema = z.object({
  id: z.number().int().positive().optional(), // absent for a new room row
  name: z.string().trim().min(1, "Give the room a name.").max(120),
  occupancy: z.coerce.number().int().positive().max(20),
  bedType: z.string().trim().max(60).nullable(),
  pricePerNightInr: z.coerce.number().int().nonnegative().max(1_000_000),
  inclusions: z.array(z.string().trim().min(1)).max(20),
  mediaId: z.coerce.number().int().positive().nullable(),
});

export const hotelSchema = z
  .object({
    name: z.string().trim().min(3, "Give it a name.").max(160),
    slug: z
      .string()
      .trim()
      .min(3, "Slug is too short.")
      .max(100)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only."),
    tagline: z.string().trim().max(200).nullable(),
    description: z.string().trim().min(1, "Write a description.").max(4000),

    address: z.string().trim().min(1, "Add an address.").max(400),
    locality: z.string().trim().max(120).nullable(),
    mapUrl: z.union([z.literal(""), z.url()]).nullable(),

    starRating: z.coerce.number().int().min(1).max(5).nullable(),
    pricePerNightInr: z.coerce.number().int().nonnegative().max(1_000_000),
    compareAtPriceInr: z.coerce.number().int().positive().max(1_000_000).nullable(),

    rating: z.coerce.number().min(0).max(5).nullable(),
    reviewCount: z.coerce.number().int().nonnegative().nullable(),
    badge: z.string().trim().max(40).nullable(),

    checkInTime: z.string().trim().max(8).nullable(),
    checkOutTime: z.string().trim().max(8).nullable(),
    amenities: z.array(z.string().trim().min(1)).max(40),
    houseRules: z.array(z.string().trim().min(1)).max(30),
    faqs: z.array(faqSchema).max(20),

    coverMediaId: z.coerce.number().int().positive().nullable(),
    rooms: z.array(roomSchema).min(1, "Add at least one room type."),
    isPublished: z.coerce.boolean(),
  })
  .refine(
    (v) => v.compareAtPriceInr === null || v.compareAtPriceInr > v.pricePerNightInr,
    { message: "The struck-through price must be higher than the real price.", path: ["compareAtPriceInr"] },
  );

export type HotelFormValues = z.infer<typeof hotelSchema>;
export type RoomFormValues = z.infer<typeof roomSchema>;
