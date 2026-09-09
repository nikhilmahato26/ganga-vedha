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
/**
 * Product kinds an enquiry form can carry. `rafting` / `bungee` / `paragliding`
 * / `zipline` all resolve against the adventures table; `general` is the
 * contact-page message with no product attached.
 */
export const ENQUIRY_PRODUCT_KINDS = [
  "rafting",
  "bungee",
  "paragliding",
  "zipline",
  "hotel",
  "package",
  "rental",
  "general",
] as const;

/**
 * Indian states and union territories, plus an escape hatch for the foreign
 * visitors Rishikesh gets a lot of. Both enquiry forms render this list and
 * the server validates against it, so the admin inbox never has to reconcile
 * "UK", "Uttrakhand" and "Uttarakhand" as three different places.
 */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman & Nicobar Islands",
  "Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
  "Outside India",
] as const;

export const enquirySchema = z
  .object({
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
    /**
     * Which state the guest is travelling from. Mandatory alongside name and
     * phone — the owner sorts and calls back off these three fields before
     * anything else on the row.
     */
    state: z
      .string()
      .trim()
      .max(60)
      .min(1, "Pick your state so we know who's calling.")
      // A plain string rather than `z.enum`, so the forms can hold the value
      // as the `string` a <select> hands back — the check below is what
      // actually enforces the list, on the server, where it counts.
      .refine((v) => (INDIAN_STATES as readonly string[]).includes(v), {
        message: "Pick your state from the list.",
      }),
    travelDate: z.string().refine((v) => v === "" || v >= todayIST(), {
      message: "Pick a date from today onwards.",
    }),
    groupSize: z.coerce
      .number()
      .int()
      .min(1, "There has to be at least one of you.")
      .max(60, "For groups over 60, message us on WhatsApp and we'll plan it properly."),
    message: z.string().trim().max(1000).optional().default(""),
    productKind: z.enum(ENQUIRY_PRODUCT_KINDS),
    /** Present for every kind except `general`. */
    productSlug: z.string().trim().max(120).optional().default(""),
    /** The contact form's "what is this about" line — required when there is no product. */
    subject: z.string().trim().max(200).optional().default(""),
    source: z.enum(["hero", "card", "detail", "floating", "contact"]).default("card"),
    /** Honeypot. A real person never fills this; a bot fills everything. */
    website: z.string().max(0).optional().default(""),
  })
  .refine((v) => v.productKind === "general" || v.productSlug.length > 0, {
    message: "Pick what you're enquiring about.",
    path: ["productSlug"],
  })
  .refine((v) => v.productKind !== "general" || v.subject.length > 0, {
    message: "Tell us what your message is about.",
    path: ["subject"],
  });

export type EnquiryProductKind = (typeof ENQUIRY_PRODUCT_KINDS)[number];

/**
 * One pickable thing in the contact form's "what is this about" picker.
 *
 * Built on the server from every published listing (see `enquiry-catalogue.ts`)
 * and handed to the client whole: the whole catalogue is a few dozen short
 * rows, so filtering happens in the browser with no round trip per keystroke.
 *
 * `kind` is what the enquiry is actually submitted as. A listing carries its
 * real kind and slug, so the server can resolve the product, snapshot its
 * price and file the enquiry against it. A destination, or anything the guest
 * types themselves, carries `general` and travels as a subject line.
 */
export type EnquiryOption = {
  /** `kind:slug` for a listing, `free:<text>` for something typed. */
  id: string;
  kind: EnquiryProductKind;
  slug: string;
  name: string;
  group: string;
  /** The one line under the name: distance, grade, locality, price. */
  meta: string | null;
  /** Bookings closed right now. Still pickable; it travels as a subject. */
  closed: boolean;
  /** Lowercased haystack: name, group, brand, locality, category, kind. */
  keywords: string;
};

export type EnquiryOptionGroup = { label: string; options: EnquiryOption[] };
export type EnquiryInput = z.input<typeof enquirySchema>;

export type EnquiryResult =
  | { ok: true; refCode: string; productName: string; persisted: boolean }
  | { ok: false; fieldErrors: Record<string, string>; formError?: string };
