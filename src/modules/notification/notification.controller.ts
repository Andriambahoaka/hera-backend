import { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { sendSuccess } from "../../core/utils/responseHandler";
import { NotificationService } from "./notification.service";

export const postNotification = asyncHandler(async (req: Request, res: Response) => {
  const result = await NotificationService.createAndSend(req.body);
  return sendSuccess(res, result);
});

export const findAllByOwner = asyncHandler(async (req: Request, res: Response) => {
  const data = await NotificationService.findAllByOwner(req.auth!.userId);
  return sendSuccess(res, data);
});