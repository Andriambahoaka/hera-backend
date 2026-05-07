import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { HTTP_STATUS } from "../constants/httpStatus";

export const mobileKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.headers["x-mobile-key"] as string | undefined;

  if (!key || key !== process.env.MOBILE_API_KEY) {
    throw new AppError({
      code: "INVALID_MOBILE_KEY",
      status: HTTP_STATUS.FORBIDDEN,
      message: "You are not authorized to perform this action"
    });
  }

  next();
};
export default mobileKeyAuth;