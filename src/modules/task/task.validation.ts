import { z } from "zod";

const applyValidationSchema = z.object({
  body: z.object({
    jobId: z.string({ required_error: "Job id is required" }).uuid(),
  }),
});

const updateStepValidationSchema = z.object({
  body: z.object({
    stepId: z.string({ required_error: "Step id is required" }).uuid(),
  }),
});

const submitProofValidationSchema = z.object({
  body: z.object({
    submissionLink: z.string().url("Submission link must be a valid URL").optional(),
    proofNote: z.string().max(2000).optional(),
  }),
});

const reviewTaskValidationSchema = z.object({
  body: z.object({
    status: z.enum(["APPROVED", "REJECTED"], { required_error: "Status is required" }),
    note: z.string().max(1000).optional(),
  }),
});

const acceptApplicationValidationSchema = z.object({
  body: z.object({}),
});

export const TaskValidation = {
  applyValidationSchema,
  updateStepValidationSchema,
  submitProofValidationSchema,
  reviewTaskValidationSchema,
  acceptApplicationValidationSchema,
};