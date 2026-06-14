
import { Request } from "express";

/**
 * Extracts a Bearer token from an Authorization header string.
 * @param authorizationHeader The raw Authorization header value
 * @returns The token string or null if invalid/missing
 */
export const extractBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
};

/**
 * Convenience helper to extract a Bearer token directly from an Express Request.
 * @param req Express Request object
 * @returns The token string or null if invalid/missing
 */
export const getTokenFromHeader = (req: Request): string | null => {
  return extractBearerToken(req.headers["authorization"]);
};
