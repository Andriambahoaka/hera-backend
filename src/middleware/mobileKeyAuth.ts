import { Request, Response, NextFunction } from "express";

export const mobileKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.headers["x-mobile-key"] as string | undefined;

  if (!key || key !== process.env.MOBILE_API_KEY) {
    res.status(403).json({
      status: "error",
      message: "You are not authorized to perform this action"
    });
    return;
  }

  next();
};
export default mobileKeyAuth;