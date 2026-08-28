import { z } from "zod";

export const reviewSchema = z.object({
  authorName: z.string().trim().min(1, "Add a name.").max(120),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(1, "Write the review.").max(2000),
  tripLabel: z.string().trim().max(80).nullable(),
  isPublished: z.coerce.boolean(),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
