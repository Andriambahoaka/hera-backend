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

/**
 * Sends a generic created response.
 */
export const sendCreated = (
  res: Response,
  data: unknown,
): Response => {
  return res.status(201).json(data);
};


