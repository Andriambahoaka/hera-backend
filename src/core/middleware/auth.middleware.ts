import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { sendUnauthorizedError } from "../utils/responseHandler";

// Helpers
const extractBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.verify(token, secret) as JwtPayload;
};

// Middleware
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction): void => {
  try {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      sendUnauthorizedError(res, "Missing or malformed authorization header");
      return;
    }

    const decoded = verifyToken(token);

    if (!decoded || typeof decoded !== "object" || !decoded.userId) {
      sendUnauthorizedError(res, "Invalid token payload");
      return;
    }

    req.auth = {
      userId: decoded.userId,
    };
    next();
  } catch (error: any) {
    sendUnauthorizedError(res, error.message || "Authentication failed");
  }
};
