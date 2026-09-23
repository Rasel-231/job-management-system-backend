import type { CookieOptions, Response } from "express";
import { env } from "./config";
import { parseExpiresInToMs, ACCESS_TOKEN_FALLBACK_MS, REFRESH_TOKEN_FALLBACK_MS } from "../utils/duration";

// Centralized cookie policy — single source of truth for auth cookies so the
// security attributes (httpOnly/sameSite/secure) are never drifted per route.
const isProd = env.NODE_ENV === "production";
const strict: CookieOptions["sameSite"] = "strict";

export const accessTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: strict,
  path: "/",
  // Derived from the exact access-token expiry so cookies and tokens expire together.
  maxAge: parseExpiresInToMs(env.JWT_ACCESS_EXPIRES_IN, ACCESS_TOKEN_FALLBACK_MS),
};

export const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: strict,
  path: "/",
  maxAge: parseExpiresInToMs(env.JWT_REFRESH_EXPIRES_IN, REFRESH_TOKEN_FALLBACK_MS),
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

// Clears every auth cookie with attributes that match how they were set.
// Used wherever a session must be ended definitively (failed refresh,
// logout) so clients can never keep holding onto a dead refreshToken.
export const clearAuthCookies = (res: Response): void => {
  const base: CookieOptions = { sameSite: strict, path: "/", secure: isProd };
  res
    .clearCookie("accessToken", { ...base, httpOnly: true })
    .clearCookie("refreshToken", { ...base, httpOnly: true })
    .clearCookie("role", { ...base, httpOnly: false });
};