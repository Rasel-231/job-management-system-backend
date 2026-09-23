import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validateRequest";
import { authLimiter, refreshLimiter } from "../../middlewares/rateLimiter.middleware";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = Router();

// Credential endpoints get a strict attempt cap to blunt brute-force attacks.
// Only applied here (credentials/OTP) — /me, /refresh-token and /logout stay
// under the global apiLimiter so normal browsing is never throttled.
router.post(
  "/register",
  authLimiter,
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.registerUser
);

router.post(
  "/login",
  authLimiter,
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.loginUser
);

router.post(
  "/social/:provider",
  authLimiter,
  validateRequest(AuthValidation.socialLoginValidationSchema),
  AuthController.socialLogin
);

router.post(
  "/otp/request",
  authenticate,
  authLimiter,
  validateRequest(AuthValidation.requestOtpValidationSchema),
  AuthController.requestOtp
);

router.post(
  "/otp/verify",
  authenticate,
  authLimiter,
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

router.post("/refresh-token", refreshLimiter, AuthController.refreshToken);
router.post("/logout", AuthController.logoutUser);

export const AuthRoutes = router;