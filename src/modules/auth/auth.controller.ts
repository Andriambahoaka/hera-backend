import { Request, Response } from "express";

import {
  signupService,
  loginService,
  forgotPasswordService,
  generateApiKeyService,
  refreshApiKeyService,
} from "./auth.service";

import {
  sendInternalError,
  sendUnauthorizedError,
  sendSuccess,
  sendBadRequestError,
  sendConflictError,
  sendNotFoundError,
} from "../../core/utils/responseHandler";

import { ERRORS } from "../../core/utils/messages.util";
import { send } from "process";

// =============================
// AUTH CONTROLLERS
// =============================

export const signup = async (req: Request, res: Response) => {
  try {
    if (req.body.ownerId?.trim() === "") {
      req.body.ownerId = null;
    }

    const result = await signupService(req.body);
    return sendSuccess(res, result);
  } catch (error: any) {
    if (error.message === ERRORS.USER_EXISTS) {
      return sendConflictError(res, error.message);
    }
    return sendBadRequestError(res, error.message);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await loginService(email, password);
    return sendSuccess(res, result);
  } catch (error) {
    return sendUnauthorizedError(res);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const result = await forgotPasswordService(email);
    return sendSuccess(res, result);
  } catch (error: any) {
    if (error.message === ERRORS.USER_NOT_FOUND) {
      return sendNotFoundError(res, error.message);
    }
    return sendInternalError(res, error);
  }
};

// =============================
// API KEY CONTROLLERS
// =============================

export const generateApiKey = async (_: Request, res: Response) => {
  try {
    const result = await generateApiKeyService();
    return sendSuccess(res, result);
  } catch (error) {
    return sendInternalError(res, error);
  }
};

export const refreshApiKey = async (req: Request, res: Response) => {
  try {
    const { refreshKey } = req.body;

    if (!refreshKey) {
      return sendBadRequestError(res, "refreshKey manquant");
    }

    const result = await refreshApiKeyService(refreshKey);
    return sendSuccess(res, result);
  } catch (error) {
    return sendUnauthorizedError(res, "refreshKey invalide");
  }
};
