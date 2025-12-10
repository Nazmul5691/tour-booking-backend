import z from "zod";

export const createGuideZodSchema = z.object({
    bio: z
        .string({ invalid_type_error: "Bio must be string" })
        .min(5, { message: "Bio must beat least 5 characters long" })
        .max(500, { message: "Bio cannot exceed 500 characters" }),
    location: z.string().min(2),
    languages: z.array(z.string()).min(1),
    experienceYears: z.number().min(0).max(50),
    perTourCharge: z.number().min(1),
    walletBalance: z.number().min(0).optional(),
    averageRating: z.number().min(0).max(5).optional(),
    totalReviews: z.number().min(0).optional()
    // documents: z.array(z.string()).min(1)
});



export const updateGuideZodSchema = z.object({
    bio: z.string().min(10).max(500).optional(),
    location: z.string().min(2).optional(),
    languages: z.array(z.string()).min(1).optional(),
    experienceYears: z.number().min(0).max(50).optional(),
    perTourCharge: z.number().min(1).optional(),
    walletBalance: z.number().min(0).optional(),
    averageRating: z.number().min(0).max(5).optional(),
    totalReviews: z.number().min(0).optional(),
    // documents: z.array(z.string()).min(1).optional()
});



export const applySchema = z.object({ message: z.string().max(500).optional() });