import bcrypt from "bcrypt";
import prisma from "../../config/db";
import AppError from "../../utils/AppError";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { generateOtp, isOtpValid } from "../../utils/otp";
import { verifyGoogleToken, verifyFacebookToken, TSocialProfile } from "../../utils/socialAuth";
import {
  TLoginResult,
  TLoginUser,
  TRegisterUser,
  TSafeUser,
  TSocialLoginResult,
} from "./auth.interface";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatarUrl: true,
  bio: true,
  skillTags: true,
  role: true,
  accountType: true,
  authProvider: true,
  status: true,
  isVerified: true,
  isPhoneVerified: true,
  warnings: true,
} as const;

const buildAuthPayload = async (user: TSafeUser): Promise<TLoginResult> => {
  const tokenPayload = { userId: user.id, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);
  return { accessToken, refreshToken, user };
};

const toSafeUser = (user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  bio: string | null;
  skillTags: string[];
  role: string;
  accountType: string;
  authProvider: string;
  status: string;
  isVerified: boolean;
  isPhoneVerified: boolean;
  password: string | null;
  warnings: number;
}): TSafeUser => {
  const { password: _pw, ...rest } = user;
  return rest as TSafeUser;
};

const registerUser = async (payload: TRegisterUser): Promise<TLoginResult> => {
  const existingUser = await prisma.user.findUnique({ where: { email: payload.email } });

  if (existingUser) {
    throw new AppError(409, "User already exists with this email");
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      phone: payload.phone ?? null,
      accountType: payload.accountType ?? "JOB_SEEKER",
      status: "ACTIVE",
    },
    select: { ...safeUserSelect, password: true },
  });

  return buildAuthPayload(toSafeUser(user));
};

const loginUser = async (payload: TLoginUser): Promise<TLoginResult> => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { ...safeUserSelect, password: true },
  });

  if (!user) throw new AppError(404, "No user found with this email");
  if (user.status === "PENDING") throw new AppError(403, "Your account is pending admin approval");
  if (user.status === "BLOCKED") throw new AppError(403, "Your account has been blocked");

  const isPasswordValid = await bcrypt.compare(payload.password, user.password as string);
  if (!isPasswordValid) throw new AppError(401, "Incorrect password");

  return buildAuthPayload(toSafeUser(user));
};

const socialLogin = async (
  profile: TSocialProfile,
  accountType?: "JOB_SEEKER" | "JOB_POSTER" | "BOTH"
): Promise<TSocialLoginResult> => {
  const providerField = profile.provider === "GOOGLE" ? "googleId" : "facebookId";

  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { [providerField]: profile.providerId },
        ...(profile.email ? [{ email: profile.email }] : []),
      ],
    },
  });

  let isNewUser = false;

  if (user) {
    // Link the social account if it was previously email-only.
    if (!user.googleId && !user.facebookId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { [providerField]: profile.providerId, authProvider: profile.provider },
      });
    }
  } else {
    isNewUser = true;
    if (!profile.email) {
      throw new AppError(400, `${profile.provider} account has no verified email — cannot register`);
    }
    user = await prisma.user.create({
      data: {
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        googleId: profile.provider === "GOOGLE" ? profile.providerId : undefined,
        facebookId: profile.provider === "FACEBOOK" ? profile.providerId : undefined,
        authProvider: profile.provider,
        accountType: accountType ?? "JOB_SEEKER",
        status: "ACTIVE",
      },
    });
  }

  if (user.status === "BLOCKED") throw new AppError(403, "Your account has been blocked");

  const result = await buildAuthPayload(toSafeUser(user));
  return { ...result, isNewUser };
};

const requestOtp = async (userId: string, phone: string) => {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: { phone, otpCode: code, otpExpiresAt: expiresAt },
  });

  // Dev mode: log + return the code so the flow is testable without an SMS gateway.
  const isConsole = process.env.OTP_PROVIDER !== "production" && process.env.OTP_PROVIDER !== "twilio";
  console.info(`[OTP] ${phone} -> ${code} (expires ${expiresAt.toISOString()})`);

  return {
    message: "OTP sent to your phone",
    devOtp: isConsole ? code : undefined,
  };
};

const verifyOtp = async (userId: string, phone: string, code: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(404, "User not found");
  if (user.phone !== phone) throw new AppError(400, "Phone number does not match your account");

  if (!isOtpValid(code, user.otpCode as string, user.otpExpiresAt)) {
    throw new AppError(400, "Invalid or expired OTP");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      isPhoneVerified: true,
      isVerified: true,
      otpCode: null,
      otpExpiresAt: null,
    },
    select: safeUserSelect,
  });

  return updated;
};

const refreshAccessToken = async (token: string): Promise<{ accessToken: string; role: string }> => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || user.status !== "ACTIVE") {
    throw new AppError(401, "User no longer active");
  }

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  return { accessToken, role: user.role };
};

const getMe = async (userId: string): Promise<TSafeUser> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ...safeUserSelect, password: true },
  });
  if (!user) throw new AppError(404, "User not found");
  return toSafeUser(user);
};

const updateProfile = async (
  userId: string,
  payload: Partial<TRegisterUser> & { bio?: string; skillTags?: string[]; avatarUrl?: string }
): Promise<TSafeUser> => {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(payload.name && { name: payload.name }),
      ...(payload.bio && { bio: payload.bio }),
      ...(payload.skillTags && { skillTags: payload.skillTags }),
      ...(payload.avatarUrl && { avatarUrl: payload.avatarUrl }),
      ...(payload.phone && { phone: payload.phone }),
      ...(payload.accountType && { accountType: payload.accountType }),
    },
    select: safeUserSelect,
  });

  return updated;
};

const verifySocialToken = (provider: "GOOGLE" | "FACEBOOK", token: string): Promise<TSocialProfile> => {
  if (provider === "GOOGLE") return verifyGoogleToken(token);
  return verifyFacebookToken(token);
};

export const AuthService = {
  registerUser,
  loginUser,
  socialLogin,
  verifySocialToken,
  requestOtp,
  verifyOtp,
  refreshAccessToken,
  getMe,
  updateProfile,
};