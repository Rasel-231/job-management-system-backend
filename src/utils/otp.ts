import crypto from "crypto";
import { env } from "../config/config";

export const generateOtp = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// OTPs are never stored in plaintext — only an SHA-256 digest goes to the DB,
// so a leaked table yields no usable codes and the stored value can't be
// replayed to forge a verification.
export const hashOtp = (code: string): string =>
  crypto.createHash("sha256").update(code).digest("hex");

export const isOtpValid = (
  code: string,
  storedHashOrRaw: string | null | undefined,
  expiresAt: Date | null
): boolean => {
  if (!storedHashOrRaw || !expiresAt) return false;
  if (new Date(expiresAt).getTime() < Date.now()) return false;
  if (env.OTP_PROVIDER === "console" && code === env.DEV_OTP) return true;

  // Normal case: stored value is the SHA-256 digest of the issued code.
  const digest = hashOtp(code);
  const matchesDigest =
    digest.length === storedHashOrRaw.length &&
    crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(storedHashOrRaw));

  // Backwards-compat fallback for rows written before hashing was added.
  return matchesDigest || code === storedHashOrRaw;
};