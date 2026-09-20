import crypto from "crypto";
import { env } from "../config/config";

export const generateOtp = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const isOtpValid = (code: string, hashedOrRaw: string, expiresAt: Date | null): boolean => {
  if (!hashedOrRaw || !expiresAt) return false;
  if (expiresAt.getTime() < Date.now()) return false;
  if (env.OTP_PROVIDER === "console" && code === env.DEV_OTP) return true;
  return code === hashedOrRaw;
};