import jwt, {
  JwtPayload,
  SignOptions,
  TokenExpiredError,
  JsonWebTokenError,
} from "jsonwebtoken";
import { env } from "../config/config";
import { TDecodedToken, TTokenPayload, TTokenType } from "../types/apiResponse";


const ALGORITHM: SignOptions["algorithm"] = "HS256";



const isValidPayloadShape = (
  payload: unknown,
  expectedType: TTokenType
): payload is TDecodedToken => {
  if (typeof payload !== "object" || payload === null) return false;

  const p = payload as Record<string, unknown>;

  return (
    typeof p.userId === "string" &&
    p.userId.length > 0 &&
    typeof p.role === "string" &&
    p.role.length > 0 &&
    p.tokenType === expectedType
  );
};

const signToken = (
  payload: TTokenPayload,
  tokenType: TTokenType,
  secret: string,
  expiresIn: string
): string => {
  const fullPayload = { ...payload, tokenType };

  return jwt.sign(fullPayload, secret, {
    expiresIn,
    algorithm: ALGORITHM,
  } as SignOptions);
};

const verifyToken = (
  token: string,
  tokenType: TTokenType,
  secret: string
): TDecodedToken => {
  let decoded: string | JwtPayload;

  try {
    decoded = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new Error(
        tokenType === "accessToken" ? "ACCESS_TOKEN_EXPIRED" : "REFRESH_TOKEN_EXPIRED"
      );
    }
    if (err instanceof JsonWebTokenError) {
      throw new Error(
        tokenType === "accessToken" ? "INVALID_ACCESS_TOKEN" : "INVALID_REFRESH_TOKEN"
      );
    }
    throw err;
  }

  if (typeof decoded === "string" || !isValidPayloadShape(decoded, tokenType)) {
    throw new Error(
      tokenType === "accessToken"
        ? "MALFORMED_ACCESS_TOKEN_PAYLOAD"
        : "MALFORMED_REFRESH_TOKEN_PAYLOAD"
    );
  }

  return decoded;
};



export const generateAccessToken = (payload: TTokenPayload): string =>
  signToken(payload, "accessToken", env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN);

export const generateRefreshToken = (payload: TTokenPayload): string =>
  signToken(payload, "refreshToken", env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

export const verifyAccessToken = (token: string): TDecodedToken =>
  verifyToken(token, "accessToken", env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token: string): TDecodedToken =>
  verifyToken(token, "refreshToken", env.JWT_REFRESH_SECRET);