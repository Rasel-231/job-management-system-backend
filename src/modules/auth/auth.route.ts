import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.registerUser
);

router.post(
  "/login",
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.loginUser
);

router.post("/refresh-token", AuthController.refreshToken);
router.post("/logout", AuthController.logoutUser);
router.get("/me", authenticate, AuthController.getMe);

export const AuthRoutes = router;
