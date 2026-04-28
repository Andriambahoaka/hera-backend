import { Request, Response, NextFunction } from 'express';
import ApiKey from '../../infrastructure/apiKey/apiKey.model';
import { sendUnauthorizedError, sendForbiddenError,sendInternalError } from '../utils/responseHandler';

const apiKeyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      sendUnauthorizedError(res, "API Key manquante");
      return;
    }

    const key = authHeader.split(" ")[1];
    const record = await ApiKey.findOne({ key });

    if (!record) {
       sendForbiddenError(res, "API Key invalide");
       return;
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      sendUnauthorizedError(res, "API Key expirée");
      return;
    }

    next();
  } catch (error: any) {
    sendInternalError(res, error.message || "Erreur interne du serveur");
  }
};

export default apiKeyMiddleware;


