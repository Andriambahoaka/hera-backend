import { Request, Response, NextFunction } from 'express';
import ApiKey from '../models/apiKey.model';

const apiKeyAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        status: 'error',
        message: 'API Key manquante',
      });
      return;
    }

    const key = authHeader.replace(/^Bearer\s+/i, '');

    const record = await ApiKey.findOne({ key });

    if (!record) {
      res.status(403).json({
        status: 'error',
        message: 'API Key invalide',
      });
      return;
    }

    if (record.expiresAt && record.expiresAt < new Date()) {
      res.status(401).json({
        status: 'error',
        message: 'API Key expirée',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Erreur API Key',
    });
  }
};

export default apiKeyAuth;
