import rateLimit from "express-rate-limit";
import { env } from "../config/config";

const isProd = env.NODE_ENV === "production";

// Broad API guard — protects the whole surface from flooding while remaining
// generous enough for legitimate paginated reads.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 300 : 2000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
});

// Stricter guard for credential/brute-force endpoints (login, refresh, ...).
// Auth failures already return 401; this caps attempts per IP per window.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 20 : 500,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later." },
});