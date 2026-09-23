import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { Permission } from "../../config/permissions";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = Router();

router.get("/", authenticate, authorize(Permission.USER_VIEW_ALL), UserController.getAllUsers);
router.get("/:id", authenticate, authorize(Permission.USER_VIEW_ALL), UserController.getSingleUser);

router.patch(
  "/:id/status",
  authenticate,
  authorize(Permission.USER_UPDATE_STATUS),
  validateRequest(UserValidation.updateStatusValidationSchema),
  UserController.updateUserStatus
);

router.patch(
  "/:id/warnings",
  authenticate,
  authorize(Permission.USER_UPDATE_STATUS),
  validateRequest(UserValidation.updateWarningsValidationSchema),
  UserController.updateUserWarnings
);

router.patch(
  "/:id",
  authenticate,
  authorize(Permission.USER_UPDATE),
  validateRequest(UserValidation.updateUserValidationSchema),
  UserController.updateUser
);

router.delete("/:id", authenticate, authorize(Permission.USER_DELETE), UserController.deleteUser);

export const UserRoutes = router;
