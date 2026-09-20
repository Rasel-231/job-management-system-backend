import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

// Assigns a unique id per request (propagated as an X-Request-Id header) so
// a single request can be traced across logs, error handlers, and downstream
// services by one stable identifier.
const requestId = (req: Request, res: Response, next: NextFunction): void => {
  const existing = req.headers["x-request-id"];
  const id = Array.isArray(existing) ? existing[0] : existing;
  req.requestId = id || randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
};

export default requestId;