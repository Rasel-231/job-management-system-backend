import { z } from "zod";

const createDisputeValidationSchema = z.object({
  body: z.object({
    jobId: z.string({ required_error: "Job id is required" }).uuid(),
    taskId: z.string().uuid().optional(),
    respondentId: z.string().uuid().optional(),
    respondentEmail: z.string().email().optional(),
    reason: z.string({ required_error: "Reason is required" }).min(10).max(2000),
  }).refine((data) => data.respondentId || data.respondentEmail, {
    message: "Provide the respondent user id or email",
  }),
});

const resolveDisputeValidationSchema = z.object({
  body: z.object({
    status: z.enum(["RESOLVED", "REJECTED"], { required_error: "Status is required" }),
    resolution: z.string().min(5).optional(),
  }),
});

export const DisputeValidation = {
  createDisputeValidationSchema,
  resolveDisputeValidationSchema,
};