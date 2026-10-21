
import { DeviceService } from './device.service';
import { asyncHandler } from "../../core/utils/asyncHandler";
import { sendCreated, sendSuccess } from "../../core/utils/responseHandler";
import { AppError } from '../../core/errors/app.error';
import { DEVICE_ERRORS } from './device.errors';
import { Request } from "express";
import { USER_ERRORS } from '../user/user.errors';
import { SUCCESS } from '../../core/utils/messages.util';

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

  await DeviceService.add({
    ownerId,
    deviceId,
    deviceName,
    devCode,
  });
  return sendCreated(res, SUCCESS.PACK_CREATED);
});

export const addAccessory = asyncHandler(async (req, res) => {
  const { deviceId, accessoryInfo } = req.body;

  if (!deviceId || !accessoryInfo) {
    throw new AppError(DEVICE_ERRORS.MISSING_ACCESSORY_FIELDS);
  }

  const { id, name, model } = accessoryInfo;
  if (!id || !name || !model) {
    throw new AppError(DEVICE_ERRORS.MISSING_ACCESSORY_INFOS);
  }

  const accessory = await DeviceService.addAccessory(deviceId, accessoryInfo);
  return sendCreated(res, SUCCESS.ACCESSORY_PAIRED);
});

export const findByDeviceId = asyncHandler(async (req, res) => {
  const ownerId = req.params.deviceId as string;
  const pack = await DeviceService.findByDeviceId(ownerId);
  return sendSuccess(res, pack);
});

export const update = asyncHandler(async (req, res) => {
  const { deviceId, ...fields } = req.body;
  const device = await DeviceService.update(deviceId, fields);
  return sendSuccess(res, device);
});

export const findAll = asyncHandler(async (_req, res) => {
  const devices = await DeviceService.findAll();
  return sendSuccess(res, devices);
});

export const findAllByOwner = asyncHandler(async (req, res) => {
  const devices = await DeviceService.findAllByOwner(req.auth!.userId);
  return sendSuccess(res, devices);
});

export const addOrUpdateAccess = asyncHandler(async (req, res) => {
  const { userId, deviceAccessId, access } = req.body;
  if (!userId || !deviceAccessId || !access) {
    throw new AppError(DEVICE_ERRORS.MISSING_ACCESS_FIELDS);
  }
  const results = await DeviceService.addOrUpdateAccess(userId, deviceAccessId, access);
  return sendSuccess(res, results);
});

export const addOrUpdateMultipleAccess = asyncHandler(async (req, res) => {
  const { userId, accessList } = req.body;
  if (!userId || !accessList) {
    throw new AppError(USER_ERRORS.MISSING_USER_ID_OR_ACCESS_LIST);
  }

  if (!Array.isArray(accessList)) {
    throw new AppError(DEVICE_ERRORS.INVALID_ACCESS_LIST);
  }
  const results = await DeviceService.addOrUpdateMultipleAccess(userId, accessList);
  return sendSuccess(res, results);
});

export const findGrantedAccess = asyncHandler(async (req, res) => {
  const accessList = await DeviceService.findGrantedAccess(req.auth!.userId);
  return sendSuccess(res, accessList);
});

export const findAccessibleDevices = asyncHandler(async (req, res) => {
  const userId = req.params.userId as string;
  const devices = await DeviceService.findAccessibleDevices(userId);
  return sendSuccess(res, devices);
});

export const setAreaArmMode = asyncHandler(async (req, res) => {
  const { deviceId, isArmed } = req.body;
  if (!deviceId || typeof isArmed !== 'boolean') {
    throw new AppError(DEVICE_ERRORS.MISSING_ARMING_REQUIRED_FIELDS);
  }

  const result = await DeviceService.setAreaArmMode(deviceId, isArmed, req.auth!.userId);

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

type AccessoryRequest = {
  deviceId: string;
  accessoriesId: string[];
};

const getAccessoryRequestData = (req: Request): AccessoryRequest => {
  const { deviceId, accessoryId } = req.body;

  if (!deviceId) {
    throw new AppError(DEVICE_ERRORS.MISSING_DEVICE_ID_FIELD);
  }

  return {
    deviceId,
    accessoriesId: accessoryId ? [accessoryId] : [],
  };
};

export const getAccessoriesInfo = asyncHandler(async (req, res) => {
  const { deviceId, accessoriesId } = getAccessoryRequestData(req);

  const result = await DeviceService.getAccessoriesInfo(
    deviceId,
    accessoriesId,
  );

  return sendSuccess(res, result);
});

export const getAccessoryStatus = asyncHandler(async (req, res) => {
  const { deviceId, accessoriesId } = getAccessoryRequestData(req);

  if (accessoriesId.length === 0) {
    throw new AppError(DEVICE_ERRORS.MISSING_ACCESSORY_ID_FIELD);
  }

  const result = await DeviceService.getAccessoryStatus(
    deviceId,
    accessoriesId,
  );

  return sendSuccess(res, result);
});

export const getPirCamSnapUrl = asyncHandler(async (req, res) => {
  const { deviceId, accessoryId, channel } = req.body;
  if (!deviceId || !accessoryId || channel == null) {
    throw new AppError(DEVICE_ERRORS.MISSING_PIRCAM_REQUIRED_FIELDS);
  }

  const result = await DeviceService.getPirCamSnapUrl(deviceId, accessoryId, channel,req.auth!.userId);

  return sendSuccess(res, result);
});

export const setAccessory = asyncHandler(async (req, res) => {
  const { deviceId, id, name, type, sensitivity, volume, entryDelay, imageInfo } = req.body;
  if (!deviceId || !type || !id) {
    throw new AppError(DEVICE_ERRORS.MISSING_SET_ACCESSORY_REQUIRED_FIELDS);
  }

  const result = await DeviceService.setAccessory(deviceId, id, name, type, sensitivity, volume, entryDelay, imageInfo);

  return sendSuccess(res, result);
});

export const deleteDevice = asyncHandler(async (req, res) => {
  const { deviceId } = req.params as { deviceId: string };

  const result = await DeviceService.deleteDevice(deviceId);

  return sendSuccess(res, result);
});

