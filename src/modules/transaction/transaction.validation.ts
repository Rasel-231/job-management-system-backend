import { z } from "zod";

const createWithdrawalValidationSchema = z.object({
  body: z.object({
    amount: z.coerce.number({ required_error: "Amount is required" }).positive(),
    method: z.enum(["BKASH", "NAGAD", "ROCKET", "BANK_TRANSFER"], {
      required_error: "Payment method is required",
    }),
    accountHolder: z.string({ required_error: "Account holder name is required" }).min(3),
    accountNumber: z
      .string({ required_error: "Account number is required" })
      .regex(/^[0-9A-Za-z-]{6,30}$/, "Invalid account number"),
  }),
});

const reviewWithdrawalValidationSchema = z.object({
  body: z.object({
    status: z.enum(["COMPLETED", "REJECTED"], { required_error: "Status is required" }),
    adminNote: z.string().optional(),
  }),
});

export const TransactionValidation = {
  createWithdrawalValidationSchema,
  reviewWithdrawalValidationSchema,
};