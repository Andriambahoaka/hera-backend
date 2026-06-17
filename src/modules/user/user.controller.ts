import { Request, Response } from "express";

import { UserService } from "./user.service";
import { sendSuccess } from "../../core/utils/responseHandler";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { AppError } from "../../core/errors/app.error";
import { USER_ERRORS } from "./user.errors";
import { COMMON_ERRORS } from "../../core/errors/common.error";
import mongoose from "mongoose";
import { validateSignupInput } from "../auth/auth.validator";

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const result = await UserService.getMe(req.auth!.userId);
  return sendSuccess(res, result);
});

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  await validateSignupInput(req.body, true);
  const result = await UserService.addMember(req.auth!.userId,req.body);
  return sendSuccess(res, result);
});

export const updateMember = asyncHandler(async (req, res) => {
  const { _id, accessList, ...fields } = req.body;
  const user = await UserService.updateMember(req.auth!.userId,_id, fields, accessList);
  return sendSuccess(res,user);
});

export const findAllMembers = asyncHandler(async (req: Request, res: Response) => {
  const result = await UserService.findAllMembers(req.auth!.userId);
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

export const updatePassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new AppError(USER_ERRORS.OLD_NEW_PASSWORD_REQUIRED);
  }

  const result = await UserService.updatePassword(req.auth!.userId, oldPassword, newPassword);
  return sendSuccess(res, result);
});

export const createPassword = asyncHandler(async (req: Request, res: Response) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    throw new AppError(USER_ERRORS.NEW_PASSWORD_REQUIRED);
  }

  const result = await UserService.createPassword(req.auth!.userId, newPassword);
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
  const { deviceToken } = req.body;
  if (!deviceToken) {
    throw new AppError(USER_ERRORS.DEVICE_TOKEN_REQUIRED);
  }

  const result = await UserService.addDeviceToken(req.auth!.userId, deviceToken);
  return sendSuccess(res, result);
});

export const deleteDeviceToken = asyncHandler(async (req: Request, res: Response) => {
  const { deviceToken } = req.body;

  if (!deviceToken) {
    throw new AppError(USER_ERRORS.DEVICE_TOKEN_REQUIRED);
  }
  
  const result = await UserService.deleteDeviceToken(req.auth!.userId, deviceToken);
  return sendSuccess(res, result);
});