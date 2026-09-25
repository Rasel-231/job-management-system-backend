import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";
import { verifyAccessToken } from "../utils/jwt";
import { Permission, hasPermission } from "../config/permissions";

export const authenticate = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken as string | undefined;

    if (!token) {
      throw new AppError(401, "You are not allowed to access this resource. Please log in.");
    }

    try {
      const decoded = verifyAccessToken(token);
      req.user = { userId: decoded.userId, role: decoded.role };
      next();
    } catch (err) {
      const message = err instanceof Error ? err.message : "UNAUTHORIZED";

      if (message === "ACCESS_TOKEN_EXPIRED") {
        throw new AppError(401, "Session expired. Please log in again.");
      }
      throw new AppError(401, "Invalid authentication token.");
    }
  }
);

export const authorize = (...permissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      throw new AppError(401, "You are not allowed to access this resource. Please log in.");
    }

    const missing = permissions.filter((p) => !hasPermission(user.role, p));

    if (missing.length > 0) {
      throw new AppError(403, "You do not have permission for this action");
    }

    next();
  };
};

export const optionalAuthenticate = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken as string | undefined;

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = verifyAccessToken(token);
      req.user = { userId: decoded.userId, role: decoded.role };
    } catch {

    }

    next();
  }
);