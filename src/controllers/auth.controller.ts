import { Request, Response } from "express";

import {
  signupService,
  loginService,
  forgotPasswordService,
  generateApiKeyService,
  refreshApiKeyService,
} from "../services/auth.service";

import {
  sendInternalError,
  sendUnauthorizedError,
  sendSuccess,
  sendBadRequestError,
  sendConflictError,
  sendNotFoundError,
} from "../utils/responseHandler";

import { ERRORS } from "../utils/messages.util";

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
    return res.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Erreur génération API Key" });
  }
};

export const refreshApiKey = async (req: Request, res: Response) => {
  try {
    const { refreshKey } = req.body;

    if (!refreshKey) {
      return res
        .status(400)
        .json({ status: "error", message: "refreshKey manquant" });
    }

    const result = await refreshApiKeyService(refreshKey);
    return res.json({
      status: "success",
      ...result,
    });
  } catch (error) {
    return res
      .status(403)
      .json({ status: "error", message: "refreshKey invalide" });
  }
};
