// controllers/user.controller.ts
import { Request, Response } from "express";
import { UserService } from "../services/user.service";
import {
  sendInternalError,
  sendSuccess,
  sendBadRequestError,
  sendUnauthorizedError,
} from "../utils/responseHandler";
import { ERRORS } from "../utils/messages.util";

const getTokenFromHeader = (req: Request): string | null => {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.split(" ")[1];
};

export const uploadImageFile = async (req: Request<{ id: string }>, res: Response) => {
  try {
    if (!req.file) return sendBadRequestError(res, ERRORS.FILE_MISSING);

    const { id } = req.params;
    const result = await UserService.uploadImageFile(id, req.file.buffer);
    return sendSuccess(res, result);
  } catch (error: any) {
    sendInternalError(res, error.message);
  }
};

export const addUserType = async (req: Request, res: Response) => {
  try {
    const { type_id, name } = req.body;
    const result = await UserService.addUserType(type_id, name);
    return sendSuccess(res, result);
  } catch (error: any) {
    sendInternalError(res, error.message);
  }
};

export const addDeviceToken = async (req: Request, res: Response) => {
  try {
    const { userId, deviceToken } = req.body;
    const result = await UserService.addDeviceToken(userId, deviceToken);
    return sendSuccess(res, result);
  } catch (error: any) {
    sendInternalError(res, error.message);
  }
};

export const findAll = async (_: Request, res: Response) => {
  try {
    const result = await UserService.findAllUsers();
    return sendSuccess(res, result);
  } catch (error: any) {
    sendInternalError(res, error.message);
  }
};

export const findAllByOwner = async (req: Request<{ ownerId: string }>, res: Response) => {
  try {
    const { ownerId } = req.params;
    const users = await UserService.findAllByOwner(ownerId);
    return sendSuccess(res, users);
  } catch (error: any) {
    sendInternalError(res, error.message);
  }
};

export const updateUserById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, userType } = req.body;
    const result = await UserService.updateUserById(id, { name, phoneNumber, userType });
    return sendSuccess(res, result);
  } catch (error: any) {
    sendInternalError(res, error.message);
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return sendBadRequestError(res, ERRORS.TOKEN_MISSING);

    const { newPassword } = req.body;
    if (!newPassword) return sendBadRequestError(res, ERRORS.PASSWORD_REQUIRED);

    const result = await UserService.resetPassword(token, newPassword);
    return sendSuccess(res, result);
  } catch (error: any) {
    sendInternalError(res, error.message);
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) return sendBadRequestError(res, ERRORS.TOKEN_MISSING);

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return sendBadRequestError(res, ERRORS.OLD_NEW_PASSWORD_REQUIRED);

    const result = await UserService.updatePassword(token, oldPassword, newPassword);
    return sendSuccess(res, result);
  } catch (error: any) {
    sendInternalError(res, error.message);
  }
};

export const deleteDeviceToken = async (req: Request, res: Response) => {
  try {
    const { userId, deviceToken } = req.body;
    const result = await UserService.deleteDeviceToken(userId, deviceToken);
    return sendSuccess(res, result);
  } catch (error: any) {
    sendInternalError(res, error.message);
  }
};

export const deleteUserById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const result = await UserService.deleteUserById(id);
    return sendSuccess(res, result);
  } catch (error: any) {
    sendInternalError(res, error.message);
  }
};

export const getUserIdByEmail = async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string | undefined;
    if (!email) return res.status(400).json({ status: "error", message: "Email manquant" });

    const userId = await UserService.getUserIdByEmail(email);
    return res.json({ status: "success", userId });
  } catch (error: any) {
    return res.status(500).json({ status: "error", message: error.message || "Erreur serveur" });
  }
};

export const findAllOwners = async (_: Request, res: Response) => {
  try {
    const result = await UserService.findAllOwners();
    return sendSuccess(res, result);
  } catch (error: any) {
    sendInternalError(res, error.message);
  }
};
