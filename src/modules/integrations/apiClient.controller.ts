import { Request, Response } from "express";
import bcrypt from "bcrypt";
import ApiClient from "./apiClient.model";
import * as apiClientService from "./apiClient.service";

import {
  generateAccessToken
} from "./apiClient.service";

import { sendSuccess } from "../../core/utils/responseHandler";

import { asyncHandler } from "../../core/utils/asyncHandler";
import { AppError } from "../../core/errors/app.error";
import { AUTH_ERRORS } from "../auth/auth.errors";

export const clientToken = asyncHandler(async (req: Request, res: Response) => {
  const { clientId, clientSecret } = req.body;

  if (!clientId || !clientSecret) {
    throw new AppError(AUTH_ERRORS.MISSING_CREDENTIALS);
  }

  const client = await ApiClient.findOne({ clientId });

  if (!client || !client.active) {
    throw new AppError(AUTH_ERRORS.CLIENT_AUTH_FAILED);
  }

  const isValid = await bcrypt.compare(
    clientSecret,
    client.clientSecretHash
  );

  if (!isValid) {
    throw new AppError(AUTH_ERRORS.CLIENT_AUTH_FAILED);
  }

  const accessToken = generateAccessToken(clientId);

  return sendSuccess(res, {
    accessToken,
    expiresIn: 3600,
  });
});

export const createApiClient = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;

  const result = await apiClientService.createApiClient(name);

  return sendSuccess(res, result);
});