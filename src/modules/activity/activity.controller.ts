import { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { sendSuccess } from "../../core/utils/responseHandler";
import { ActivityService } from "./activity.service";


export const addActivity = asyncHandler(async (req: Request, res: Response) => {
  const result = await ActivityService.addActivity(req.body);
  return sendSuccess(res, result);
});

export const findActivitiesByDate = asyncHandler(async (req: Request, res: Response) => {
  const result = await ActivityService.findActivitiesByDate({
    ownerId: req.query.ownerId as string,
    date: req.query.date as string | undefined,
  });

  return sendSuccess(res, result);
});