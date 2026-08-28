import { z } from "zod";
import { normalizePhoneIN, todayIST } from "@/lib/format";

/**
 * The enquiry contract, deliberately NOT inside the "use server" module.
 *
 * A "use server" file may only export async functions — exporting a Zod object
 * from one throws at request time, not at build time, so the page compiles and
 * then 500s the first time somebody actually submits.
 *
 * Living here also means the client and the server validate against the same
 * object. A rule enforced only in the browser is not a rule.
 */
export const enquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tell us your name so we know who we're messaging.")
    .max(120),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizePhoneIN(v) !== null, {
      message: "Indian mobile numbers are 10 digits starting with 6, 7, 8 or 9.",
    }),
  email: z.union([z.literal(""), z.email("That email address doesn't look right.")]),
  travelDate: z
    .string()
    .refine((v) => v === "" || v >= todayIST(), {
      message: "Pick a date from today onwards.",
    }),
  groupSize: z.coerce
    .number()
    .int()
    .min(1, "There has to be at least one of you.")
    .max(60, "For groups over 60, message us on WhatsApp and we'll plan it properly."),
  message: z.string().trim().max(1000).optional().default(""),
  productKind: z.enum(["rafting", "bungee", "hotel"]),
  productSlug: z.string().min(1),
  source: z.enum(["hero", "card", "detail", "floating"]).default("card"),
  /** Honeypot. A real person never fills this; a bot fills everything. */
  website: z.string().max(0).optional().default(""),
});

export type EnquiryInput = z.input<typeof enquirySchema>;

export type EnquiryResult =
  | { ok: true; refCode: string; productName: string; persisted: boolean }
  | { ok: false; fieldErrors: Record<string, string>; formError?: string };
