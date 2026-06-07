import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "../../core/errors/app.error";
import { COMMON_ERRORS } from "../../core/errors/common.error";
import { AUTH_ERRORS } from "./auth.errors";
import { extractBearerToken } from "./auth.utils";


const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError(COMMON_ERRORS.INTERNAL_SERVER_ERROR);
  }
  console.log("JWT_SECRET:", secret);

  return jwt.verify(token, secret) as JwtPayload;
};

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {

  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    throw new AppError(AUTH_ERRORS.INVALID_AUTH_HEADER);
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new AppError(AUTH_ERRORS.INVALID_AUTH_HEADER);
  }

  if (!decoded || typeof decoded !== "object" || !decoded.userId) {
    throw new AppError(AUTH_ERRORS.INVALID_AUTH_HEADER);
  }

  req.auth = { userId: decoded.userId };
  next();
};
