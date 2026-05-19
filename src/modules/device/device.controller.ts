
import { DeviceService } from './device.service';
import { asyncHandler } from "../../core/utils/asyncHandler";
import { sendSuccess } from "../../core/utils/responseHandler";
import { AppError } from '../../core/errors/app.error';
import { DEVICE_ERRORS } from './device.errors';

export const add = asyncHandler(async (req, res) => {
  const {
    ownerId,
    deviceId,
    deviceName,
    devCode,
  } = req.body;

  if (!ownerId || !deviceId || !deviceName || !devCode) {
    throw new AppError(DEVICE_ERRORS.MISSING_REQUIRED_FIELDS);
  }

  const device = await DeviceService.add({
    ownerId,
    deviceId,
    deviceName,
    devCode,
  });
  return sendSuccess(res, device);
});

export const updateDeviceNames = asyncHandler(async (req, res) => {
  await DeviceService.updateDeviceNames(req.body.updates);
  return sendSuccess(res, { message: "Device names updated" });
});

export const editUrgencyNumber = asyncHandler(async (req, res) => {
  const pack = await DeviceService.updateUrgencyNumber(
    req.body.deviceId,
    req.body.urgencyNumber
  );
  return sendSuccess(res, pack);
});

export const findByDeviceId = asyncHandler(async (req, res) => {
  const ownerId = req.params.deviceId as string;
  const pack = await DeviceService.findByDeviceId(ownerId);
  return sendSuccess(res, pack);
});

export const update = asyncHandler(async (req, res) => {
  const { deviceId, ...fields } = req.body;
  const pack = await DeviceService.update(deviceId, fields);
  return sendSuccess(res, pack);
});

export const findAll = asyncHandler(async (_req, res) => {
  const devices = await DeviceService.findAll();
  return sendSuccess(res, devices);
});

export const findAllByOwner = asyncHandler(async (req, res) => {
  const ownerId = req.params.ownerId as string;
  const devices = await DeviceService.findAllByOwner(ownerId);
  return sendSuccess(res, devices);
});

export const addOrUpdateAccess = asyncHandler(async (req, res) => {
  const results = await DeviceService.addOrUpdateAccess(req.body);
  return sendSuccess(res, results);
});

export const findAllAccessByUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;
  const accessList = await DeviceService.findAllAccessByUser(userId);
  return sendSuccess(res, accessList);
});


export const setAreaArmMode = asyncHandler(async (req, res) => {
  const { deviceId, armingMode } = req.body;
  if (!deviceId || !armingMode) {
    throw new AppError(DEVICE_ERRORS.MISSING_ARMING_REQUIRED_FIELDS);
  }

  const result = await DeviceService.setAreaArmMode(deviceId, armingMode);

  return sendSuccess(res, result);
});

export const getAreaArmMode = asyncHandler(async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) {
    throw new AppError(DEVICE_ERRORS.MISSING_DEVICE_ID_FIELD);
  }

  const result = await DeviceService.getAreaArmMode(deviceId);

  return sendSuccess(res, result);
});