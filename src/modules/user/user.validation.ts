import { z } from "zod";

const updateStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(["PENDING", "ACTIVE", "BLOCKED"], {
      required_error: "Status is required",
    }),
  }),
});

export const UserValidation = { updateStatusValidationSchema };
