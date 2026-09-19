import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import upload from "../../middlewares/upload.middleware";
import { Permission } from "../../config/permissions";
import { TaskController } from "./task.controller";
import { TaskValidation } from "./task.validation";

const router = Router();

router.get(
  "/my-tasks",
  authenticate,
  authorize(Permission.TASK_VIEW_OWN),
  TaskController.getMyTasks
);

router.get(
  "/job/:jobId/applications",
  authenticate,
  authorize(Permission.TASK_REVIEW),
  TaskController.getJobApplications
);

router.get("/", authenticate, authorize(Permission.TASK_VIEW_ALL), TaskController.getAllTasks);

router.post(
  "/apply",
  authenticate,
  authorize(Permission.TASK_APPLY),
  validateRequest(TaskValidation.applyValidationSchema),
  TaskController.applyForJob
);

router.post(
  "/:id/accept",
  authenticate,
  authorize(Permission.TASK_REVIEW),
  TaskController.acceptApplication
);

router.post(
  "/:id/complete-step",
  authenticate,
  authorize(Permission.TASK_UPDATE_PROGRESS),
  validateRequest(TaskValidation.updateStepValidationSchema),
  TaskController.completeStep
);

router.post(
  "/:id/submit-proof",
  authenticate,
  authorize(Permission.TASK_UPDATE_PROGRESS),
  upload.single("proofFile"),
  validateRequest(TaskValidation.submitProofValidationSchema),
  TaskController.submitProof
);

router.patch(
  "/:id/review",
  authenticate,
  authorize(Permission.TASK_REVIEW),
  validateRequest(TaskValidation.reviewTaskValidationSchema),
  TaskController.reviewTask
);

router.get("/:id", authenticate, TaskController.getSingleTask);

export const TaskRoutes = router;