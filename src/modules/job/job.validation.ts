import { z } from "zod";

// multipart/form-data sends everything as strings — coerce reward to number.
const createJobValidationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required" }).min(3),
    description: z.string({ required_error: "Description is required" }).min(10),
    reward: z.coerce.number({ required_error: "Reward is required" }).positive(),
    proofRequirements: z.string({ required_error: "Proof requirements are required" }),
  }),
});

const updateJobValidationSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    reward: z.coerce.number().positive().optional(),
    proofRequirements: z.string().optional(),
  }),
});

export const JobValidation = { createJobValidationSchema, updateJobValidationSchema };
