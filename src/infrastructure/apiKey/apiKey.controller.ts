import { Request, Response } from "express";

import {
  generateApiKeyService,
  refreshApiKeyService,
} from "./apiKey.service";

import { sendSuccess } from "../../core/utils/responseHandler";

import { asyncHandler } from "../../core/utils/asyncHandler";
import { AppError } from "../../core/errors/app.error";
import { AUTH_ERRORS } from "../../modules/auth/auth.errors";

// =============================
// API KEY CONTROLLERS
// =============================


export const generateApiKey = asyncHandler(async (_: Request, res: Response) => {
  const result = await generateApiKeyService();
  return sendSuccess(res, result);
});

export const refreshApiKey = asyncHandler(async (req: Request, res: Response) => {
  const { refreshKey } = req.body;

  if (!refreshKey) {
    throw new AppError(AUTH_ERRORS.REFRESH_KEY_MISSING);
  }

  const result = await refreshApiKeyService(refreshKey);
  return sendSuccess(res, result);
});