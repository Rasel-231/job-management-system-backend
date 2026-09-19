import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { env } from "../config/config";

export type TTokenPayload = {
  userId: string;
  role: string;
};

export const generateAccessToken = (payload: TTokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  } as SignOptions);
};

export const generateRefreshToken = (payload: TTokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload & TTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload & TTokenPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload & TTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload & TTokenPayload;
};
