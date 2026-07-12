import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { Permission } from "../../config/permissions";
import { TransactionController } from "./transaction.controller";

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

export const TransactionRoutes = router;
