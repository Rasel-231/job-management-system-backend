import { z } from "zod";

const updateStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "ACTIVE", "BLOCKED"], {
      required_error: "Status is required",
    }),
  }),
});

const updateWarningsValidationSchema = z.object({
  body: z.object({
    action: z.enum(["warn", "clear"], { required_error: "Action is required" }),
  }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z
      .string()
      .regex(/^\+?[0-9\s-]{6,20}$/, "Invalid phone number")
      .optional()
      .nullable(),
    role: z.enum(["ADMIN", "USER"]).optional(),
    accountType: z.enum(["JOB_SEEKER", "JOB_POSTER", "BOTH"]).optional(),
    status: z.enum(["PENDING", "ACTIVE", "BLOCKED"]).optional(),
    isVerified: z.boolean().optional(),
    isPhoneVerified: z.boolean().optional(),
  }),
});

export const UserValidation = {
  updateStatusValidationSchema,
  updateWarningsValidationSchema,
  updateUserValidationSchema,
};