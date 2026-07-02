import { asyncHandler } from "../../core/utils/asyncHandler";
import jwt from "jsonwebtoken";
import { AppError } from "../../core/errors/app.error";
import { AUTH_ERRORS } from "../../modules/auth/auth.errors";

export const clientAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError(AUTH_ERRORS.UNAUTHORIZED);
  }

  const token = authHeader.split(" ")[1];

  let decoded: any;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch (err) {
    throw new AppError(AUTH_ERRORS.UNAUTHORIZED); 
  }

  if (decoded.type !== "client") {
    throw new AppError(AUTH_ERRORS.UNAUTHORIZED);
  }

  next();
});