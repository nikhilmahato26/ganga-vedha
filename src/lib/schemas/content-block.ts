import { z } from "zod";
import { WHY_US_ICONS } from "@/lib/why-us-icons";

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
