import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import upload from "../../middlewares/upload.middleware";
import { Permission } from "../../config/permissions";
import { VerificationController } from "./verification.controller";
import { VerificationValidation } from "./verification.validation";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(Permission.VERIFICATION_SUBMIT),
  upload.single("document"),
  validateRequest(VerificationValidation.createVerificationValidationSchema),
  VerificationController.submitVerification
);

router.get(
  "/",
  authenticate,
  authorize(Permission.VERIFICATION_VIEW_ALL),
  VerificationController.getAllVerifications
);

router.get(
  "/my",
  authenticate,
  authorize(Permission.VERIFICATION_SUBMIT),
  VerificationController.getMyVerifications
);

router.patch(
  "/:id/review",
  authenticate,
  authorize(Permission.VERIFICATION_REVIEW),
  validateRequest(VerificationValidation.reviewVerificationValidationSchema),
  VerificationController.reviewVerification
);

export const VerificationRoutes = router;