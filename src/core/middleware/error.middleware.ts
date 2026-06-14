import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app.error";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.status : 500;

  return res.status(statusCode).json({
    code:err.code || "INTERNAL_SERVER_ERROR",
    message: err.message || "Internal Server Error",
  });
};