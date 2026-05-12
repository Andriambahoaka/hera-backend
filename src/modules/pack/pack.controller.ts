
import { PackService } from './pack.service';
import { asyncHandler } from "../../core/utils/asyncHandler";
import { sendSuccess } from "../../core/utils/responseHandler";
import { AppError } from '../../core/errors/app.error';
import { PACK_ERRORS } from './pack.errors';

export const addPack = asyncHandler(async (req, res) => {
  const {
    ownerId,
    deviceId,
    deviceName,
    devCode,
  } = req.body;

  if (!ownerId || !deviceId || !deviceName || !devCode) {
    throw new AppError(PACK_ERRORS.MISSING_REQUIRED_FIELDS);
  }

  const pack = await PackService.createPack({
    ownerId,
    deviceId,
    deviceName,
    devCode,
  });
  return sendSuccess(res, pack);
});

export const updateDeviceNames = asyncHandler(async (req, res) => {
  await PackService.updateDeviceNames(req.body.updates);
  return sendSuccess(res, { message: "Device names updated" });
});

export const editUrgencyNumber = asyncHandler(async (req, res) => {
  const pack = await PackService.updateUrgencyNumber(
    req.body.deviceId,
    req.body.urgencyNumber
  );
  return sendSuccess(res, pack);
});

export const findByDeviceId = asyncHandler(async (req, res) => {
  const ownerId = req.params.deviceId as string;
  const pack = await PackService.findByDeviceId(ownerId);
  return sendSuccess(res, pack);
});

export const update = asyncHandler(async (req, res) => {
  const { deviceId, ...fields } = req.body;
  const pack = await PackService.updatePack(deviceId, fields);
  return sendSuccess(res, pack);
});

export const findAll = asyncHandler(async (_req, res) => {
  const packs = await PackService.findAll();
  return sendSuccess(res, packs);
});

export const findAllByOwner = asyncHandler(async (req, res) => {
  const ownerId = req.params.ownerId as string;
  const packs = await PackService.findAllByOwner(ownerId);
  return sendSuccess(res, packs);
});

export const addOrUpdatePackAccess = asyncHandler(async (req, res) => {
  const results = await PackService.addOrUpdatePackAccess(req.body);
  return sendSuccess(res, results);
});

export const findAllPackAccessByUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;
  const accessList = await PackService.findAllPackAccessByUser(userId);
  return sendSuccess(res, accessList);
});
