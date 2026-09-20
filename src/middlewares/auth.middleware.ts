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

    const decoded = verifyAccessToken(token);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  }
);

export const authorize = (...permissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, "You are not allowed to access this resource. Please log in.");
    }

    const missing = permissions.filter((p) => !hasPermission(req.user!.role, p));

    if (missing.length > 0) {
      throw new AppError(403, "You do not have permission for this action");
    }

    next();
  };
};
