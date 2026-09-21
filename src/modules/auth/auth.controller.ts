import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import {
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
  roleCookieOptions,
  clearAuthCookies,
} from "../../config/cookies";
import { AuthService } from "./auth.service";

const attachAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  role: string
): void => {
  res
    .cookie("accessToken", accessToken, accessTokenCookieOptions)
    .cookie("refreshToken", refreshToken, refreshTokenCookieOptions)
    .cookie("role", role, roleCookieOptions);
};

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);

  attachAuthCookies(res, result.accessToken, result.refreshToken, result.user.role);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Registered successfully. Welcome!",
    data: { accessToken: result.accessToken, user: result.user },
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);

  attachAuthCookies(res, result.accessToken, result.refreshToken, result.user.role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully",
    data: { accessToken: result.accessToken, user: result.user },
  });
});

const socialLogin = catchAsync(async (req: Request, res: Response) => {
  const provider = req.params.provider.toUpperCase() === "GOOGLE" ? "GOOGLE" : "FACEBOOK";
  const { token, accountType } = req.body as { token: string; accountType?: "JOB_SEEKER" | "JOB_POSTER" | "BOTH" };

  const profile = await AuthService.verifySocialToken(provider, token);
  const result = await AuthService.socialLogin(profile, accountType);

  attachAuthCookies(res, result.accessToken, result.refreshToken, result.user.role);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully",
    data: { accessToken: result.accessToken, user: result.user, isNewUser: result.isNewUser },
  });
});

const requestOtp = catchAsync(async (req: Request, res: Response) => {
  const { phone } = req.body as { phone: string };
  const result = await AuthService.requestOtp(req.user!.userId, phone);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { phone, code } = req.body as { phone: string; code: string };
  const result = await AuthService.verifyOtp(req.user!.userId, phone, code);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Phone verified successfully",
    data: result,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.updateProfile(req.user!.userId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) {
    clearAuthCookies(res);
    res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "Refresh token missing" });
    return;
  }

  try {
    const result = await AuthService.refreshAccessToken(token);

    res
      .cookie("accessToken", result.accessToken, accessTokenCookieOptions)
      .cookie("refreshToken", result.refreshToken, refreshTokenCookieOptions)
      .cookie("role", result.role, roleCookieOptions);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Access token refreshed",
      data: { accessToken: result.accessToken, refreshToken: result.refreshToken, role: result.role },
    });
  } catch (error) {
    // A failed refresh means the presented refreshToken is dead (revoked,
    // expired, replayed, or the user is no longer active). Delete the auth
    // cookies so the browser doesn't keep "authenticated" cookies that the
    // middleware turns into an endless /login ↔ protected-page redirect loop.
    clearAuthCookies(res);
    throw error;
  }
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  try {
    await AuthService.revokeRefreshToken(req.cookies?.refreshToken);
  } catch {
    // ignore revocation failure — the client must be signed out regardless
  }

  clearAuthCookies(res);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.getMe(req.user!.userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Current user retrieved successfully",
    data: result,
  });
});

export const AuthController = {
  registerUser,
  loginUser,
  socialLogin,
  requestOtp,
  verifyOtp,
  updateProfile,
  refreshToken,
  logoutUser,
  getMe,
};