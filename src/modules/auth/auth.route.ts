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

router.post(
  "/social/:provider",
  validateRequest(AuthValidation.socialLoginValidationSchema),
  AuthController.socialLogin
);

router.post(
  "/otp/request",
  authenticate,
  validateRequest(AuthValidation.requestOtpValidationSchema),
  AuthController.requestOtp
);

router.post(
  "/otp/verify",
  authenticate,
  validateRequest(AuthValidation.verifyOtpValidationSchema),
  AuthController.verifyOtp
);

router.get("/me", authenticate, AuthController.getMe);

router.patch(
  "/me",
  authenticate,
  validateRequest(AuthValidation.updateProfileValidationSchema),
  AuthController.updateProfile
);

router.post("/refresh-token", AuthController.refreshToken);
router.post("/logout", AuthController.logoutUser);

export const AuthRoutes = router;