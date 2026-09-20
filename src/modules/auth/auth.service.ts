import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcrypt";
import prisma from "../../config/db";
import AppError from "../../utils/AppError";
import { hashToken } from "../../utils/tokenHash";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";
import { TLoginResult, TLoginUser, TRefreshResult, TRegisterUser, TSafeUser } from "./auth.interface";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  avatarUrl: true,
} as const;

const tokenExpiryFromJwt = (token: string): Date => {
  const { exp } = jwt.decode(token) as JwtPayload;
  if (!exp) throw new AppError(500, "Could not determine token expiry");
  return new Date(exp * 1000);
};

const persistRefreshToken = async (userId: string, refreshToken: string): Promise<void> => {
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: tokenExpiryFromJwt(refreshToken),
    },
  });
};

const registerUser = async (payload: TRegisterUser): Promise<TSafeUser> => {
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
    },
    select: safeUserSelect,
  });

  return user;
};

const loginUser = async (payload: TLoginUser): Promise<TLoginResult> => {
  const user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) throw new AppError(404, "No user found with this email");
  if (user.status === "PENDING") throw new AppError(403, "Your account is pending admin approval");
  if (user.status === "BLOCKED") throw new AppError(403, "Your account has been blocked");

  const isPasswordValid = await bcrypt.compare(payload.password, user.password);
  if (!isPasswordValid) throw new AppError(401, "Incorrect password");

  const tokenPayload = { userId: user.id, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await persistRefreshToken(user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
    },
  };
};

const refreshAccessToken = async (token: string): Promise<TRefreshResult> => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, "Invalid or expired refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (
    !stored ||
    stored.revokedAt !== null ||
    stored.expiresAt.getTime() <= Date.now() ||
    stored.userId !== decoded.userId
  ) {
    throw new AppError(401, "Refresh token is no longer valid");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || user.status !== "ACTIVE") {
    await prisma.refreshToken.updateMany({
      where: { userId: decoded.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw new AppError(401, "User no longer active");
  }

  // Rotate: revoke the presented token and chain it to a fresh one. If a
  // stolen token is replayed after a legitimate rotation it is already
  // revoked, so it can never mint new access tokens.
  const newRefreshToken = generateRefreshToken({ userId: user.id, role: user.role });

  await prisma.$transaction(async (tx) => {
    const replacement = await tx.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: tokenExpiryFromJwt(newRefreshToken),
      },
    });
    await tx.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedById: replacement.id },
    });
  });

  return {
    accessToken: generateAccessToken({ userId: user.id, role: user.role }),
    refreshToken: newRefreshToken,
    role: user.role,
  };
};

const revokeRefreshToken = async (token?: string): Promise<void> => {
  if (!token) return;

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

const getMe = async (userId: string): Promise<TSafeUser> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: safeUserSelect });
  if (!user) throw new AppError(404, "User not found");
  return user;
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshAccessToken,
  revokeRefreshToken,
  getMe,
};