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
 * Sends a 201 Created success response.
 */
export const sendCreated = (
  res: Response,
  data: unknown,
  message: string = "Created successfully"
): Response => {
  return res.status(201).json({ message, data });
};

/**
 * Sends a 400 Bad Request error response.
 */
export const sendBadRequestError = (res: Response, error: string): Response => {
  return res.status(400).json({ message: error });
};

/**
 * Sends a 401 Unauthorized error response.
 */
export const sendUnauthorizedError = (
  res: Response,
  error: string = "Credentials are incorrect"
): Response => {
  return res.status(401).json({ message: error });
};

/**
 * Sends a 403 Forbidden error response.
 */
export const sendForbiddenError = (res: Response, error: string): Response => {
  return res.status(403).json({ message: error });
};

/**
 * Sends a 404 Not Found error response.
 */
export const sendNotFoundError = (res: Response, message: string): Response => {
  return res.status(404).json({ message });
};

/**
 * Sends a 409 Conflict error response.
 */
export const sendConflictError = (res: Response, error: string): Response => {
  return res.status(409).json({ message: error });
};

/**
 * Sends a 422 Unprocessable Entity error response.
 */
export const sendUnprocessableEntityError = (
  res: Response,
  message: string
): Response => {
  return res.status(422).json({ message });
};

/**
 * Sends a 500 Internal Server Error response.
 */
export const sendInternalError = (res: Response, error: unknown): Response => {
  return res.status(500).json({ message: "An unknown error occurred", error });
};
