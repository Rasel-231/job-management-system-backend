import bcrypt from "bcrypt";
import prisma from "../../config/db";
import AppError from "../../utils/AppError";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { TLoginResult, TLoginUser, TRegisterUser, TSafeUser } from "./auth.interface";

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  avatarUrl: true,
} as const;

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
  const user = await prisma.user.findUnique({ where: { id: userId }, select: safeUserSelect });
  if (!user) throw new AppError(404, "User not found");
  return user;
};

export const AuthService = {
  registerUser,
  loginUser,
  refreshAccessToken,
  getMe,
};
