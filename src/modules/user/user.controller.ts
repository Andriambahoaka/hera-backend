import { Request, Response } from "express";

import { UserService } from "./user.service";
import { sendSuccess } from "../../core/utils/responseHandler";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { AppError } from "../../core/errors/app.error";
import { USER_ERRORS } from "./user.errors";
import { COMMON_ERRORS } from "../../core/errors/common.error";
import mongoose from "mongoose";
import { getTokenFromHeader } from "../auth/auth.utils";
import { resetPasswordService } from "../auth/auth.service";


// =============================
// CONTROLLERS
// =============================

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) { throw new AppError(COMMON_ERRORS.UNAUTHORIZED); }

  const result = await UserService.getMe(userId);
  return sendSuccess(res, result);
});

export const uploadImageFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(USER_ERRORS.NO_IMAGE_PROVIDED);
  }

  const userId = req.auth?.userId;
  if (!userId) { throw new AppError(COMMON_ERRORS.UNAUTHORIZED); }

  const result = await UserService.uploadImageFile(userId, req.file.buffer);
  return sendSuccess(res, result);
});

export const addUserType = asyncHandler(async (req: Request, res: Response) => {
  const { type_id, name } = req.body;

  const result = await UserService.addUserType(type_id, name);
  return sendSuccess(res, result);
});

export const findAll = asyncHandler(async (_: Request, res: Response) => {
  const result = await UserService.findAllUsers();
  return sendSuccess(res, result);
});

export const findAllByOwner = asyncHandler(async (req: Request, res: Response) => {
  const ownerId = req.params.ownerId as string;
  if (!ownerId) { throw new AppError(USER_ERRORS.OWNER_ID_REQUIRED); }
  const result = await UserService.findAllByOwner(ownerId);
  return sendSuccess(res, result);
});

export const updateUserById = asyncHandler(async (req: Request, res: Response) => {
  const { name, phoneNumber, userType } = req.body;
  const userId = req.params.id as string;

  if (!userId) { throw new AppError(USER_ERRORS.USER_ID_REQUIRED); }

  const result = await UserService.updateUserById(userId, {
    name,
    phoneNumber,
    userType,
  });

  return sendSuccess(res, result);
});


export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new AppError(USER_ERRORS.OLD_NEW_PASSWORD_REQUIRED);
  }

  const userId = req.auth?.userId;

  if (!userId) {
    throw new AppError(COMMON_ERRORS.UNAUTHORIZED);
  }

  const result = await UserService.updatePassword(userId, oldPassword, newPassword);
  return sendSuccess(res, result);
});

export const createPassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  console.log("User ID for createPassword:", userId);

  if (!userId) {
    throw new AppError(COMMON_ERRORS.UNAUTHORIZED);
  }

  const {newPassword } = req.body;

  if (!newPassword) {
    throw new AppError(USER_ERRORS.NEW_PASSWORD_REQUIRED);
  }

  const result = await UserService.createPassword(userId, newPassword);
  return sendSuccess(res, result);
});


export const deleteUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id as string;
  if (!userId) { throw new AppError(USER_ERRORS.USER_ID_REQUIRED); }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError(USER_ERRORS.INVALID_USER_ID);
  }

  const result = await UserService.deleteUserById(userId);
  return sendSuccess(res, result);
});

export const getUserIdByEmail = asyncHandler(async (req: Request, res: Response) => {
  const email = req.query.email as string;
  if (!email) { throw new AppError(USER_ERRORS.EMAIL_REQUIRED); }

  const userId = await UserService.getUserIdByEmail(email);
  return sendSuccess(res, { userId });
});

export const findAllOwners = asyncHandler(async (_: Request, res: Response) => {
  const result = await UserService.findAllOwners();
  return sendSuccess(res, result);
});


export const addDeviceToken = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) { throw new AppError(COMMON_ERRORS.UNAUTHORIZED); }

  const { deviceToken } = req.body;
  if (!deviceToken) {
    throw new AppError(USER_ERRORS.DEVICE_TOKEN_REQUIRED);
  }

  const result = await UserService.addDeviceToken(userId, deviceToken);
  return sendSuccess(res, result);
});


export const deleteDeviceToken = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new AppError(COMMON_ERRORS.UNAUTHORIZED);
  }

  const { deviceToken } = req.body;

  if (!deviceToken) {
    throw new AppError(USER_ERRORS.DEVICE_TOKEN_REQUIRED);
  }

  const result = await UserService.deleteDeviceToken(userId, deviceToken);
  return sendSuccess(res, result);
});