import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import AppError from "../utils/AppError";
import logger from "../utils/logger";
import { env } from "../config/env";

type TErrorSource = { path: string; message: string }[];

const isDev = env.NODE_ENV === "development";

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
    // Map well-known Prisma codes to safe, human messages. In production the
    // raw driver message (which can leak constraint/table/driver internals)
    // stays in the logs and never reaches the client.
    statusCode = 400;
    message = "Database request error";
    errorSources = [{ path: "", message: "Database error" }];

    if (err.code === "P2002" && Array.isArray(err.meta?.target)) {
      statusCode = 409;
      message = "A record with this value already exists";
      errorSources = [
        { path: String(err.meta.target[0]), message: `${err.meta.target[0]} is already taken` },
      ];
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "The requested record does not exist";
      errorSources = [{ path: "", message: "Record not found" }];
    }
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ path: "", message: err.message }];
  } else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Session expired, please log in again";
    errorSources = [{ path: "", message: "Token expired" }];
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid or malformed authentication token";
    errorSources = [{ path: "", message: "Invalid token" }];
  } else if (err instanceof Error) {
    message = err.message;
    errorSources = [{ path: "", message: err.message }];
  }

  logger.error(
    {
      requestId: req.requestId,
      url: req.originalUrl,
      method: req.method,
      statusCode,
      message,
      ...(isDev && err instanceof Error ? { stack: err.stack } : {}),
    },
    "Request failed"
  );

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: isDev && err instanceof Error ? err.stack : undefined,
  });
};

export default globalErrorHandler;