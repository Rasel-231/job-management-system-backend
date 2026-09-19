import { z } from "zod";

const createVerificationValidationSchema = z.object({
  body: z.object({
    type: z.enum(["NID", "BIRTH_CERTIFICATE"], { required_error: "Verification type is required" }),
    documentNumber: z.string().optional(),
  }),
});

const reviewVerificationValidationSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"], { required_error: "Status is required" }),
    note: z.string().optional(),
  }),
});

export const VerificationValidation = {
  createVerificationValidationSchema,
  reviewVerificationValidationSchema,
};