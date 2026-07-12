import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import upload from "../../middlewares/upload.middleware";
import { Permission } from "../../config/permissions";
import { TaskController } from "./task.controller";
import { TaskValidation } from "./task.validation";

const router = Router();

router.post(
  "/",
  authenticate,
  authorize(Permission.TASK_SUBMIT),
  upload.single("proofFile"),
  validateRequest(TaskValidation.createTaskValidationSchema),
  TaskController.createTask
);

router.get("/my-tasks", authenticate, authorize(Permission.TASK_VIEW_OWN), TaskController.getMyTasks);
router.get("/", authenticate, authorize(Permission.TASK_VIEW_ALL), TaskController.getAllTasks);

router.patch(
  "/:id/status",
  authenticate,
  authorize(Permission.TASK_REVIEW),
  validateRequest(TaskValidation.updateTaskStatusValidationSchema),
  TaskController.updateTaskStatus
);

router.get("/:id", authenticate, TaskController.getSingleTask); // ownership checked in controller

export const TaskRoutes = router;
