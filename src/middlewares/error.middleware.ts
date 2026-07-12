import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import { env } from "../config/env";

type TErrorSource = { path: string; message: string }[];

// Normalizes Zod validation errors, Prisma errors, AppError instances, and
// unknown thrown values into one consistent JSON error contract.
const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Something went wrong";
  let errorSources: TErrorSource = [{ path: "", message: "Something went wrong" }];

  if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation Error";
    errorSources = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;
    message = "Database request error";
    errorSources = [{ path: "", message: err.message }];
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ path: "", message: err.message }];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [{ path: "", message: err.message }];
  }

  logger.error({ url: req.originalUrl, statusCode, message });

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: env.NODE_ENV === "development" && err instanceof Error ? err.stack : undefined,
  });
};

export default globalErrorHandler;
