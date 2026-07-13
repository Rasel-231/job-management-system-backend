import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { env } from "../../config/env";
import { AuthService } from "./auth.service";

const isProd = env.NODE_ENV === "production";

const accessTokenCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict" as const,
  maxAge: 15 * 60 * 1000,
};

const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};


const roleCookieOptions = {
  httpOnly: false,
  secure: isProd,
  sameSite: "strict" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.registerUser(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Registered successfully. Awaiting admin approval.",
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);

  res
    .cookie("accessToken", result.accessToken, accessTokenCookieOptions)
    .cookie("refreshToken", result.refreshToken, refreshTokenCookieOptions)
    .cookie("role", result.user.role, roleCookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully",
    data: { accessToken: result.accessToken, user: result.user },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) {
    res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: "Refresh token missing" });
    return;
  }

  const result = await AuthService.refreshAccessToken(token);

  res.cookie("accessToken", result.accessToken, accessTokenCookieOptions);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token refreshed",
    data: { accessToken: result.accessToken },
  });
});

const logoutUser = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie("accessToken").clearCookie("refreshToken").clearCookie("role");

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
  refreshToken,
  logoutUser,
  getMe,
};
