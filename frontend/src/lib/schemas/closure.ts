import { z } from "zod";

export const closureMessageSchema = z.object({
  icon: z.enum(["rain", "wrench", "calendar", "alert"]),
  title: z.string().trim().min(1, "Give it a headline.").max(160),
  body: z.string().trim().min(1, "Write the message.").max(2000),
  footnote: z.string().trim().max(160).nullable(),
  ctaLabel: z.string().trim().min(1).max(40),
});

export type ClosureMessageValues = z.infer<typeof closureMessageSchema>;

/**
 * A closure the owner creates for a specific reason — a single hotel under
 * renovation, one rafting stretch shut for a landslide — rather than the
 * fixed three whole-service switches. `entity` scope needs a target;
 * `global` (the whole site) needs none.
 */
export const customClosureSchema = closureMessageSchema
  .extend({
    scope: z.enum(["entity", "global"]),
    entityType: z.enum(["adventure", "hotel"]).nullable(),
    entityId: z.coerce.number().int().positive().nullable(),
    isActive: z.coerce.boolean(),
  })
  .refine((v) => v.scope !== "entity" || (v.entityType !== null && v.entityId !== null), {
    message: "Pick which listing this closure applies to.",
    path: ["entityId"],
  });

export type CustomClosureValues = z.infer<typeof customClosureSchema>;
