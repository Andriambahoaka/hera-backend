import { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { sendSuccess } from "../../core/utils/responseHandler";
import { NotificationService } from "./notification.service";

export const findAllForUser = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const data = await NotificationService.findAllForUser(req.auth!.userId,page,limit);
  return sendSuccess(res, data);
});