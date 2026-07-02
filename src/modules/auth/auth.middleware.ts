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

  return jwt.verify(token, secret) as JwtPayload;
};

export const userAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {

  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    throw new AppError(AUTH_ERRORS.INVALID_AUTH_HEADER);
  }
  try {
    const decoded = verifyToken(token);

    if (!decoded || typeof decoded !== "object" || !decoded.userId) {
      throw new AppError(AUTH_ERRORS.UNAUTHORIZED);
    }

    req.auth = { userId: decoded.userId };
    next();

  } catch (err) {
    throw new AppError(AUTH_ERRORS.UNAUTHORIZED);
  }
};
