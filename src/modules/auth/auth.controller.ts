import { Request, Response } from "express";

import {
  signupService,
  loginService,
  forgotPasswordService,
  refreshTokenService,
  resetPasswordService,
} from "./auth.service";

import { sendSuccess, } from "../../core/utils/responseHandler";
import { validateSignupInput } from "./auth.validator";

import { asyncHandler } from "../../core/utils/asyncHandler";
import { AppError } from "../../core/errors/app.error";
import { AUTH_ERRORS } from "./auth.errors";
import { USER_ERRORS } from "../user/user.errors";
import { getTokenFromHeader } from "./auth.utils";

// =============================
// AUTH CONTROLLERS
// =============================

export const signup = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.ownerId?.trim() === "") {
    req.body.ownerId = null;
  }

  await validateSignupInput(req.body);

  const result = await signupService(req.body);
  return sendSuccess(res, result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await loginService(email, password);
  return sendSuccess(res, result);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const token = getTokenFromHeader(req);

  console.log("token azo",token);

  if (!token) {
    throw new AppError(USER_ERRORS.RESET_PASSWORD_TOKEN_MISSING);
  }

  const { newPassword } = req.body;

  const result = await resetPasswordService(token, newPassword);
  return sendSuccess(res, result);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError(AUTH_ERRORS.EMAIL_REQUIRED);
  }
  const result = await forgotPasswordService(email);
  return sendSuccess(res, result);
});

// =============================
// TOKEN CONTROLLERS
// =============================

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
    if (!refreshToken) {
    throw new AppError(AUTH_ERRORS.REFRESH_TOKEN_REQUIRED);
  }
  const result = await refreshTokenService(refreshToken);
  return sendSuccess(res, result);
});

