import { Request, Response } from "express";
import { asyncHandler } from "../../core/utils/asyncHandler";
import { sendSuccess } from "../../core/utils/responseHandler";
import { DolynkAuthService } from "./dolynk-auth.service";

export const getDolynkClientHeaders = asyncHandler(
  async (req: Request, res: Response) => {
    const session =
      await DolynkAuthService.generateClientHeaders();

    return sendSuccess(res, session);
  }
);