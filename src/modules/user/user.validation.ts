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

export const UserValidation = { updateStatusValidationSchema, updateWarningsValidationSchema };