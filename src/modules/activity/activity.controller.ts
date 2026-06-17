import { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { sendSuccess } from "../../core/utils/responseHandler";
import { ActivityService } from "./activity.service";


export const addActivity = asyncHandler(async (req: Request, res: Response) => {
  const result = await ActivityService.addActivity(req.body);
  return sendSuccess(res, result);
});

export const findActivitiesByDate = asyncHandler(async (
  req: Request,
  res: Response
) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const date = req.query.date as string | undefined;

  const result = await ActivityService.findActivitiesByDate(
    req.auth!.userId,
    date,
    page,
    limit
  );

  return sendSuccess(res, result);
});