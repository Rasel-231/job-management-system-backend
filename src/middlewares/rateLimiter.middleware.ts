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

// Stricter guard for credential/brute-force endpoints (login, register,
// social, OTP). Auth failures already return 401; this caps attempts per IP
// per window. Deliberately NOT applied to /me or /refresh-token — those are
// hit on every page load / token cycle and must stay under the global apiLimiter.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 20 : 500,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts, please try again later." },
});

// Refresh-token endpoint is anonymous and issued new credentials per call,
// so it gets its own modest cap instead of sharing the strict 20/window
// credential limiter (which would lock out normal users on heavy pages).
export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProd ? 100 : 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many refresh attempts, please try again later." },
});