import z from "zod";
import { IsActive, Role } from "./user.interface";

export const createUserZodSchema = z.object({
    name: z
        .string({ invalid_type_error: "Name must be string" })
        .min(2, { message: "Name too short. Minimum two character long." })
        .max(50, { message: "Name too  long." }),
    email: z
        .string({ invalid_type_error: "Email must be string" })
        .email({ message: "Invalid Email address format" })
        .min(5, { message: "Email must beat least 5 characters long" })
        .max(100, { message: "Email cannot exceed 100 characters" }),
    password: z
        .string({ invalid_type_error: "Password must be string" })
        .min(8, { message: "Password must be 8 character long" })
        .regex(/[A-Z]/, { message: "Password must include at least one uppercase letter" })
        .regex(/\d/, { message: "Password must include at least one digit" })
        .regex(/[!@#$%^&*]/, { message: "Password must include at least one special character" }),
    phone: z
        .string({ invalid_type_error: "Phone number must be string" })
        .regex(/^(?:\+8801|01)[0-9]{9}$/, {
            message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX"
        })
        .optional(),
    address: z
        .string({ invalid_type_error: "Address must be string" })
        .max(200, { message: "Address cannot exceed 100 characters" })
        .optional(),
})



export const updateUserZodSchema = z.object({
    name: z
        .string({ invalid_type_error: "Name must be string" })
        .min(2, { message: "Name too short. Minimum two character long." })
        .max(50, { message: "Name too  long." })
        .optional(),
    // password: z
    //     .string({ invalid_type_error: "Password must be string" })
    //     .min(8, { message: "Password must be 8 character long" })
    //     .regex(/[A-Z]/, { message: "Password must include at least one uppercase letter" })
    //     .regex(/\d/, { message: "Password must include at least one digit" })
    //     .regex(/[!@#$%^&*]/, { message: "Password must include at least one special character" })
    //     .optional(),
    phone: z
        .string({ invalid_type_error: "Phone number must be string" })
        .regex(/^(?:\+8801|01)[0-9]{9}$/, {
            message: "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX"
        })
        .optional(),
    role: z
        .enum(Object.values(Role) as [string])
        .optional(),
    isActive: z
        .enum(Object.values(IsActive) as [string])
        .optional(),
    isDeleted: z
        .boolean({ invalid_type_error: "isDeleted must be true or false" })
        .optional(),
    isVerified: z
        .boolean({ invalid_type_error: "isVerified must be true or false" })
        .optional(),
    address: z
        .string({ invalid_type_error: "Address must be string" })
        .max(200, { message: "Address cannot exceed 100 characters" })
        .optional(),
})