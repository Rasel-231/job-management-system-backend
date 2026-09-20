import { z } from "zod";

const jobStepsField = z.union([
  z.string(),
  z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
    })
  ),
  z.literal(""),
]);

// multipart/form-data sends everything as strings — coerce numbers/dates.
const createJobValidationSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required" }).min(3),
    description: z.string({ required_error: "Description is required" }).min(10),
    requirements: z.string().optional(),
    proofRequirements: z.string({ required_error: "Proof requirements are required" }),
    reward: z.coerce.number({ required_error: "Reward is required" }).positive(),
    category: z
      .enum(
        [
          "WEB_DEVELOPMENT",
          "GRAPHIC_DESIGN",
          "CONTENT_WRITING",
          "DIGITAL_MARKETING",
          "VIDEO_EDITING",
          "DATA_ENTRY",
          "MOBILE_APPS",
          "SOCIAL_MEDIA",
          "OTHER",
        ],
        { required_error: "Category is required" }
      )
      .default("OTHER"),
    deadline: z.string().optional().nullable(),
    steps: jobStepsField.optional(),
  }),
});

const updateJobValidationSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    description: z.string().min(10).optional(),
    requirements: z.string().optional(),
    proofRequirements: z.string().optional(),
    reward: z.coerce.number().positive().optional(),
    category: z
      .enum([
        "WEB_DEVELOPMENT",
        "GRAPHIC_DESIGN",
        "CONTENT_WRITING",
        "DIGITAL_MARKETING",
        "VIDEO_EDITING",
        "DATA_ENTRY",
        "MOBILE_APPS",
        "SOCIAL_MEDIA",
        "OTHER",
      ])
      .optional(),
    status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED", "CANCELLED"]).optional(),
    deadline: z.string().optional().nullable(),
    steps: jobStepsField.optional(),
  }),
});

const addCommentValidationSchema = z.object({
  body: z.object({
    content: z.string({ required_error: "Comment is required" }).min(1).max(2000),
  }),
});

export const JobValidation = {
  createJobValidationSchema,
  updateJobValidationSchema,
  addCommentValidationSchema,
};