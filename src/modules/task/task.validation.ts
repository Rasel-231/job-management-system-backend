import { z } from "zod";

const createTaskValidationSchema = z.object({
  body: z.object({
    jobId: z.string({ required_error: "Job ID is required" }).uuid(),
    submissionLink: z
      .string({ required_error: "Submission link is required" })
      .url("Submission link must be a valid URL"),
  }),
});

const updateTaskStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "APPROVED", "REJECTED"], { required_error: "Status is required" }),
  }),
});

export const TaskValidation = { createTaskValidationSchema, updateTaskStatusValidationSchema };
