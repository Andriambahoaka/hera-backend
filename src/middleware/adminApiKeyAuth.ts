import { Request, Response, NextFunction } from "express";

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const adminKey = req.headers["x-admin-key"] as string | undefined;

  if (!adminKey || adminKey !== process.env.MASTER_ADMIN_KEY) {
    res.status(403).json({
      status: "error",
      message: "Clé administrateur invalide"
    });
    return;
  }

  next();
};

export default adminMiddleware;