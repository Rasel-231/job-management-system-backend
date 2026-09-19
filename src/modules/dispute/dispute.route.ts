import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { Permission } from "../../config/permissions";
import { DisputeController } from "./dispute.controller";
import { DisputeValidation } from "./dispute.validation";

const router = Router();

router.get("/my", authenticate, authorize(Permission.DISPUTE_VIEW_OWN), DisputeController.getMyDisputes);
router.get("/", authenticate, authorize(Permission.DISPUTE_VIEW_ALL), DisputeController.getAllDisputes);

router.post(
  "/",
  authenticate,
  authorize(Permission.DISPUTE_CREATE),
  validateRequest(DisputeValidation.createDisputeValidationSchema),
  DisputeController.createDispute
);

router.patch(
  "/:id/resolve",
  authenticate,
  authorize(Permission.DISPUTE_RESOLVE),
  validateRequest(DisputeValidation.resolveDisputeValidationSchema),
  DisputeController.resolveDispute
);

export const DisputeRoutes = router;