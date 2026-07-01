import { Response } from "express";

/**
 * Sends a generic success response.
 */
export const sendSuccess = (
  res: Response,
  data: unknown,
): Response => {
  return res.status(200).json(data);
};


