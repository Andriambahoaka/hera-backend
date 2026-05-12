import crypto from "crypto";
import ApiKey  from "./apiKey.model";
import { AUTH_ERRORS } from "../../modules/auth/auth.errors";
import { COMMON_ERRORS } from "../../core/errors/common.error";
import { AppError } from "../../core/errors/app.error";

export const generateRandomToken = (size = 64) =>
  crypto.randomBytes(size).toString("hex");

export const hashToken = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

export const generateApiKeyService = async () => {
  const apiKey = "hera_" + generateRandomToken(32);
  const refreshKey = generateRandomToken(64);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const newKey = new ApiKey({
    key: hashToken(apiKey),
    refreshKey: hashToken(refreshKey),
    expiresAt,
  });

  await newKey.save();

  return {
    apiKey,
    refreshKey,
    expiresAt,
  };
};

export const refreshApiKeyService = async (refreshKey: string) => {
  if (!refreshKey) {
    throw new AppError(COMMON_ERRORS.UNAUTHORIZED);
  }

  const hashedRefreshKey = hashToken(refreshKey);

  const record = await ApiKey.findOne({
    refreshKey: hashedRefreshKey,
  });

  if (!record) {
    throw new AppError(AUTH_ERRORS.REFRESH_KEY_INVALID);
  }


  if (record.expiresAt < new Date()) {
    throw new AppError(AUTH_ERRORS.REFRESH_KEY_EXPIRED);
  }

  const newApiKey = "hera_" + generateRandomToken(32);
  const newRefreshKey = generateRandomToken(64);

  record.key = hashToken(newApiKey);
  record.refreshKey = hashToken(newRefreshKey);
  record.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await record.save();

  return {
    apiKey: newApiKey,
    refreshKey: newRefreshKey,
    expiresAt: record.expiresAt,
  };
};