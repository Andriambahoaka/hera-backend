import { NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import Device from "./device.model";
import DeviceAccess, { AccessLevel } from "./deviceAccess.model";
import { AppError } from "../../core/errors/app.error";
import { DEVICE_ERRORS } from "./device.errors";
import { AUTH_ERRORS } from "../auth/auth.errors";
import { asyncHandler } from "../../core/utils/asyncHandler";

/**
 * Access level of a user on a device:
 * - the device owner is implicitly ADMIN (level 3);
 * - anyone else gets the level stored in DeviceAccess, or NONE.
 */
export async function getDeviceAccessLevel(
  userId: string,
  device: { _id: Types.ObjectId; ownerId: Types.ObjectId }
): Promise<AccessLevel> {
  if (device.ownerId.toString() === userId) return AccessLevel.ADMIN;

  const access = await DeviceAccess.findOne({ userId, device: device._id })
    .select("accessLevel")
    .lean();

  return access?.accessLevel ?? AccessLevel.NONE;
}

/**
 * Loads a device by its Dolynk deviceId and checks the user's level on it.
 * - unknown device, or no access at all -> 404 (don't reveal which devices exist)
 * - access below `minLevel`             -> 403
 */
export async function findDeviceWithAccess(
  userId: string,
  deviceId: unknown,
  minLevel: AccessLevel
) {
  if (typeof deviceId !== "string" || !deviceId) {
    throw new AppError(DEVICE_ERRORS.MISSING_DEVICE_ID_FIELD);
  }

  const device = await Device.findOne({ deviceId });
  if (!device) throw new AppError(DEVICE_ERRORS.DEVICE_NOT_FOUND);

  const level = await getDeviceAccessLevel(userId, device);
  if (level === AccessLevel.NONE) throw new AppError(DEVICE_ERRORS.DEVICE_NOT_FOUND);
  if (level < minLevel) throw new AppError(DEVICE_ERRORS.DEVICE_ACCESS_DENIED);

  return { device, level };
}

/**
 * Route guard: requires an authenticated user (run after userAuth) with at
 * least `minLevel` on the device named by `:deviceId` or `body.deviceId`.
 * The loaded device and level are exposed on `req.deviceAccess`.
 */
export const requireDeviceAccess = (minLevel: AccessLevel) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth?.userId) throw new AppError(AUTH_ERRORS.UNAUTHORIZED);

    const deviceId = req.params.deviceId ?? req.body?.deviceId;
    req.deviceAccess = await findDeviceWithAccess(req.auth.userId, deviceId, minLevel);
    next();
  });
