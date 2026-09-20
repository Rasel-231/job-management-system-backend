import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { authLimiter } from "../../middlewares/rateLimiter.middleware";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

// Credential endpoints get a strict attempt cap to blunt brute-force attacks.
router.use(authLimiter);

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
