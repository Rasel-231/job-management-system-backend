import type { CookieOptions } from "express";
import { env } from "./env";

// Centralized cookie policy — single source of truth for auth cookies so the
// security attributes (httpOnly/sameSite/secure) are never drifted per route.
const isProd = env.NODE_ENV === "production";
const strict: CookieOptions["sameSite"] = "strict";

export const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: strict,
  path: "/",
  maxAge: 15 * 60 * 1000,
};

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: strict,
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const roleCookieOptions: CookieOptions = {
  httpOnly: false,
  secure: isProd,
  sameSite: strict,
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const clearCookieOptions = {
  httpOnly: true,
  sameSite: strict,
  path: "/",
};