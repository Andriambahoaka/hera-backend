import { Request, Response, NextFunction } from "express";
import { AppError } from "../shared/errors/AppError";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  return res.status(statusCode).json({
    message: err.message || "Internal Server Error",
  });
};