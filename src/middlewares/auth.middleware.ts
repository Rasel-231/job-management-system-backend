import { NextFunction, Request, Response } from "express";
import AppError from "../utils/AppError";
import catchAsync from "../utils/catchAsync";
import { verifyAccessToken } from "../utils/jwt";
import { Permission, hasPermission } from "../config/permissions";

// Verifies the access token (read from the httpOnly cookie, falling back to
// the Authorization header for non-browser API clients) and attaches the
// decoded identity to req.user. Does NOT check role — that's authorize()'s job.
export const authenticate = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    const bearer = req.headers.authorization?.split(" ")[1];
    const cookieToken = req.cookies?.accessToken;
    const token = cookieToken || bearer;

    if (!token) {
      throw new AppError(401, "You are not authorized");
    }

    const decoded = verifyAccessToken(token);
    req.user = { userId: decoded.userId, role: decoded.role };
    next();
  }
);

// Declarative permission check — routes declare WHAT is required,
// config/permissions.ts decides WHO satisfies it.
export const authorize = (...permissions: Permission[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, "You are not authorized");
    }

    const missing = permissions.filter((p) => !hasPermission(req.user!.role, p));

    if (missing.length > 0) {
      throw new AppError(403, "You do not have permission for this action");
    }

    next();
  };
};
