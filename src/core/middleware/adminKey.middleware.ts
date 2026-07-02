import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app.error";
import { HTTP_STATUS } from "../constants/httpStatus";

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const adminKey = req.headers["x-admin-key"] as string | undefined;

  if (!adminKey || adminKey !== process.env.MASTER_ADMIN_KEY) {
   throw new AppError({
      code: "INVALID_ADMIN_KEY",
      message: "Invalid or missing admin key.",
      status: HTTP_STATUS.UNAUTHORIZED,
    });
  }

  next();
};

export default adminMiddleware;