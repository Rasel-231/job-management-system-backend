import AppError from "./AppError";
import { env } from "../config/config";

export type TSocialProfile = {
  provider: "GOOGLE" | "FACEBOOK";
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  emailVerified: boolean;
};

// Dev-only placeholder tokens used by the frontend SocialLoginButtons when
// no real social app is configured. In non-production this lets the whole
// flow (register → badge) be exercised end-to-end without live credentials.
const DEV_GOOGLE_TOKEN = "dev_google_token_provides_verification_via_google_tokeninfo";
const DEV_FACEBOOK_TOKEN = "dev_facebook_token_handled_by_graph_api";

const isDev = () => env.NODE_ENV !== "production";

const googleDevProfile = (): TSocialProfile => ({
  provider: "GOOGLE",
  providerId: "dev-google-" + Date.now(),
  email: `dev.google.${Date.now()}@example.com`,
  name: "Dev Google User",
  emailVerified: true,
});

const facebookDevProfile = (): TSocialProfile => ({
  provider: "FACEBOOK",
  providerId: "dev-facebook-" + Date.now(),
  email: `dev.fb.${Date.now()}@example.com`,
  name: "Dev Facebook User",
  emailVerified: true,
});

// Google — exchange the OAuth id_token for profile info via Google's
// public tokeninfo endpoint (verifies the token signature against Google).
export const verifyGoogleToken = async (idToken: string): Promise<TSocialProfile> => {
  if (isDev() && idToken === DEV_GOOGLE_TOKEN) return googleDevProfile();

  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError(400, "Google OAuth is not configured");
  }

  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!res.ok) {
    throw new AppError(401, "Invalid Google token");
  }

  const payload = (await res.json()) as Record<string, string>;

  if (payload.aud !== env.GOOGLE_CLIENT_ID) {
    throw new AppError(401, "Google token audience mismatch");
  }

  return {
    provider: "GOOGLE",
    providerId: payload.sub,
    email: payload.email,
    name: payload.name || "Google User",
    avatarUrl: payload.picture,
    emailVerified: payload.email_verified === "true",
  };
};

// Facebook — verify a user access token (from FB.login) against the
// Graph API and fetch the profile fields we need server-side.
export const verifyFacebookToken = async (accessToken: string): Promise<TSocialProfile> => {
  if (isDev() && accessToken === DEV_FACEBOOK_TOKEN) return facebookDevProfile();

  if (!env.FACEBOOK_APP_ID) {
    throw new AppError(400, "Facebook OAuth is not configured");
  }

  const res = await fetch(
    `https://graph.facebook.com/v20.0/me?fields=id,name,email,picture&access_token=${encodeURIComponent(accessToken)}`
  );

  if (!res.ok) {
    throw new AppError(401, "Invalid Facebook token");
  }

  const payload = (await res.json()) as Record<string, { name?: string; data?: { url?: string } } & string>;

  return {
    provider: "FACEBOOK",
    providerId: payload.id as string,
    email: (payload.email as string) || "",
    name: (payload.name as string) || "Facebook User",
    avatarUrl: (payload.picture as { data?: { url?: string } })?.data?.url,
    emailVerified: true,
  };
};