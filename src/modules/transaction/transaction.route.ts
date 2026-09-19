import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { Permission } from "../../config/permissions";
import { TransactionController } from "./transaction.controller";
import { TransactionValidation } from "./transaction.validation";

const router = Router();

router.get(
  "/",
  authenticate,
  authorize(Permission.TRANSACTION_VIEW_ALL),
  TransactionController.getAllTransactions
);

router.get(
  "/my-earnings",
  authenticate,
  authorize(Permission.TRANSACTION_VIEW_OWN),
  TransactionController.getMyEarningsSummary
);

router.get(
  "/my-withdrawals",
  authenticate,
  authorize(Permission.WITHDRAWAL_VIEW_OWN),
  TransactionController.getMyWithdrawals
);

router.get(
  "/withdrawals",
  authenticate,
  authorize(Permission.WITHDRAWAL_VIEW_ALL),
  TransactionController.getAllWithdrawals
);

router.post(
  "/withdrawals",
  authenticate,
  authorize(Permission.WITHDRAWAL_CREATE),
  validateRequest(TransactionValidation.createWithdrawalValidationSchema),
  TransactionController.requestWithdrawal
);

router.patch(
  "/withdrawals/:id",
  authenticate,
  authorize(Permission.WITHDRAWAL_REVIEW),
  validateRequest(TransactionValidation.reviewWithdrawalValidationSchema),
  TransactionController.reviewWithdrawal
);

export const TransactionRoutes = router;