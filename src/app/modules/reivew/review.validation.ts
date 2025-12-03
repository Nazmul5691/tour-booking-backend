import { z } from "zod";

export const createTourReviewValidation = z.object({
  booking: z.string(),
  tour: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});


export const createGuideReviewValidation = z.object({
  booking: z.string(),
  guide: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});