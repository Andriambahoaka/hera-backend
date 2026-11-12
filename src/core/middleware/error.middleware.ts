import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app.error";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.status : 500;

  // Unexpected errors are logged (expected AppErrors are not). Query strings are
  // dropped so reset tokens never reach the logs; request bodies are never logged.
  if (statusCode >= 500 && process.env.NODE_ENV !== "test") {
    console.error(
      `[500] ${req.method} ${req.originalUrl.split("?")[0]}:`,
      err?.code ? `code=${err.code}` : "",
      err?.stack || err
    );
  }

  return res.status(statusCode).json({
    code:err.code || "INTERNAL_SERVER_ERROR",
    message: err.message || "Internal Server Error",
  });
};