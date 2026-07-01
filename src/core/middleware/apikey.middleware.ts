import { Request, Response, NextFunction } from 'express';
import ApiKey from '../../infrastructure/apiKey/apiKey.model';
import { extractBearerToken } from '../../modules/auth/auth.utils';
import { AUTH_ERRORS } from '../../modules/auth/auth.errors';
import { AppError } from '../errors/app.error';
import { asyncHandler } from '../utils/asyncHandler';
import { hashToken } from '../../infrastructure/apiKey/apiKey.service';

const apiKeyMiddleware = asyncHandler(async (req, res, next) => {
  const key = extractBearerToken(req.headers.authorization);

  if (!key) {
    throw new AppError(AUTH_ERRORS.INVALID_AUTH_HEADER);
  }

  const hashedKey = hashToken(key);

  const record = await ApiKey.findOne({ key: hashedKey });
  if (!record) {
    throw new AppError(AUTH_ERRORS.INVALID_API_KEY);
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    throw new AppError(AUTH_ERRORS.API_KEY_EXPIRED);
  }

  next();
});


export default apiKeyMiddleware;