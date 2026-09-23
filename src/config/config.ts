import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

// Single validated env source — consumed everywhere via `import { env } from "../config/config"`.
// Existing .env works out of the box: JWT_SECRET / JWT_EXPIRES_IN / JWT_REFRESH_EXPIRES_IN
// are aliased to the access/refresh pair when the dedicated vars are not set.
const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const NODE_ENV = process.env.NODE_ENV || "development";

// Fail fast on launch instead of surfacing cryptic runtime errors later.
// Missing critical config (DB url, JWT secrets) is a deployment bug — crash now.
const requireEnv = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const DEV_SECRET_MARKERS = ["dev-", "change-me", "secret-change-me"];

const assertSecureSecrets = (): void => {
  if (NODE_ENV !== "production") return;

  const access = jwtAccessSecret || "";
  const refresh = jwtRefreshSecret || "";
  const insecure = [...DEV_SECRET_MARKERS].some(
    (marker) => access.includes(marker) || refresh.includes(marker)
  );

  if (insecure) {
    throw new Error(
      "Refusing to start in production with dev-grade JWT secrets. Set strong JWT_ACCESS_SECRET / JWT_REFRESH_SECRET."
    );
  }
};

assertSecureSecrets();

export const env = {
  NODE_ENV,
  BASE_URL: process.env.BASE_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
  CLIENT_URL: requireEnv("CLIENT_URL", process.env.CLIENT_URL || process.env.FRONTEND_URL),
  PORT: process.env.PORT || "5000",
  DATABASE_URL: requireEnv("DATABASE_URL", process.env.DATABASE_URL),

  JWT_ACCESS_SECRET: jwtAccessSecret as string,
  JWT_REFRESH_SECRET: jwtRefreshSecret as string,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN:
    process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
  APP_PASSWORD: process.env.APP_PASSWORD,

  // Social login — Google & Facebook OAuth (see .env placeholders)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
  FACEBOOK_REDIRECT_URI: process.env.FACEBOOK_REDIRECT_URI,

  // Mobile OTP — plug in a provider later; falls back to dev console logging
  OTP_PROVIDER: process.env.OTP_PROVIDER || 'console',
  SMS_API_KEY: process.env.SMS_API_KEY,
  SMS_SENDER_ID: process.env.SMS_SENDER_ID,
  DEV_OTP: process.env.DEV_OTP || '123456',

  // Bkash/Nagad/Rocket/Bank — merchant credentials (Sandbox by default)
  payment: {
    storeId: process.env.Store_ID || process.env.STORE_ID,
    storePassword: process.env.Store_Password || process.env.STORE_PASSWORD,
  },
};

export default env;