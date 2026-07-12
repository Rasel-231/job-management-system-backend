import { NextFunction, Request, RequestHandler, Response } from "express";

// Wraps an async controller so thrown/rejected errors are forwarded to
// Express's error-handling middleware instead of crashing the process.
const catchAsync = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
