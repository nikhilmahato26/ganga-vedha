import { z } from "zod";
import { WHY_US_ICONS } from "@/lib/why-us-icons";
import { HERO_ROOMS_MAX, HERO_ROOM_PHOTO_PATTERN } from "@/lib/hero-rooms";

const iconKeys = Object.keys(WHY_US_ICONS) as [string, ...string[]];

const whyUsItemSchema = z.object({
  icon: z.enum(iconKeys),
  title: z.string().trim().min(1, "Give it a title.").max(100),
  body: z.string().trim().min(1, "Write a line about it.").max(300),
});

export const whyUsBlockSchema = z.object({
  title: z.string().trim().min(1, "Give the section a heading.").max(160),
  subtitle: z.string().trim().max(300).nullable(),
  items: z.array(whyUsItemSchema).min(1, "Add at least one reason.").max(8),
});

export type WhyUsBlockValues = z.infer<typeof whyUsBlockSchema>;

const heroRoomItemSchema = z.object({
  name: z.string().trim().min(1, "Give the room a name.").max(80),
  detail: z.string().trim().max(80),
  bed: z.enum(["double", "single"]),
  priceInr: z.coerce.number().int().nonnegative("Price can't be negative.").max(1_000_000),
  priceUnit: z.string().trim().min(1, "Say what the price is for, e.g. per night.").max(30),
  mediaId: z.coerce.number().int().positive().nullable(),
  photo: z.string().regex(HERO_ROOM_PHOTO_PATTERN).nullable(),
});

export const heroRoomsBlockSchema = z.object({
  items: z
    .array(heroRoomItemSchema)
    .min(1, "Add at least one room.")
    .max(HERO_ROOMS_MAX, `No more than ${HERO_ROOMS_MAX} rooms.`),
});

export type HeroRoomsBlockValues = z.infer<typeof heroRoomsBlockSchema>;
