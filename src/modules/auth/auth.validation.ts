import { z } from "zod";

// Minimum viable hardening: 8+ chars with at least one lowercase, one uppercase
// and one digit. Kept deliberately simple so the frontend can mirror it exactly.
export const passwordSchema = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, "Password must contain a lowercase letter, an uppercase letter and a number");

const registerValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(2),
    email: z.string({ required_error: "Email is required" }).email(),
    password: passwordSchema,
    phone: z.string().optional(),
    accountType: z.enum(["JOB_SEEKER", "JOB_POSTER", "BOTH"]).optional(),
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email(),
    password: z.string({ required_error: "Password is required" }),
  }),
});

const socialLoginValidationSchema = z.object({
  body: z.object({
    token: z.string({ required_error: "OAuth token is required" }),
    accountType: z.enum(["JOB_SEEKER", "JOB_POSTER", "BOTH"]).optional(),
  }),
});

const requestOtpValidationSchema = z.object({
  body: z.object({
    phone: z
      .string({ required_error: "Phone number is required" })
      .regex(/^(\+?[0-9]{10,15})$/, "Invalid phone number"),
  }),
});

const verifyOtpValidationSchema = z.object({
  body: z.object({
    phone: z.string({ required_error: "Phone number is required" }),
    code: z.string({ required_error: "OTP code is required" }).length(6),
  }),
});

const updateProfileValidationSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    bio: z.string().max(500).optional(),
    skillTags: z.array(z.string().max(40)).max(15).optional(),
    avatarUrl: z.string().url().optional(),
    phone: z.string().regex(/^(\+?[0-9]{10,15})$/).optional(),
    accountType: z.enum(["JOB_SEEKER", "JOB_POSTER", "BOTH"]).optional(),
  }),
});

export const AuthValidation = {
  registerValidationSchema,
  loginValidationSchema,
  socialLoginValidationSchema,
  requestOtpValidationSchema,
  verifyOtpValidationSchema,
  updateProfileValidationSchema,
};