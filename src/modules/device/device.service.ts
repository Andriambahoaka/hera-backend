import mongoose from 'mongoose';
import Device from './device.model';
import PackAccess from './deviceAccess.model';
import User from '../user/user.model';

import { AppError } from "../../core/errors/app.error";
import { DEVICE_ERRORS } from "./device.errors";
import { DolynkClient } from '../../shared/integrations/dolynk/dolynk.client';
import { DolynkCrypto } from '../../shared/integrations/dolynk/dolynk.crypto';
import { USER_TYPE } from '../user/enums/userType.enum';
import { fromDevice } from './utils/deviceAccessFactory';
import { COMMON_ERRORS } from '../../core/errors/common.error';
import { USER_ERRORS } from '../user/user.errors';

export class DeviceService {

  // =============================
  // CREATE
  // =============================
  static async add(data: {
    ownerId: string;
    deviceId: string;
    deviceName: string;
    devCode: string;
  }) {
    let { ownerId, deviceId, deviceName, devCode } = data;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      throw new AppError(DEVICE_ERRORS.INVALID_OWNER_ID);
    }

    const owner = await User.findById(ownerId);
    if (!owner) {
      throw new AppError(DEVICE_ERRORS.OWNER_NOT_FOUND);
    }

    if (owner.userType === 2 || owner.userType === 3) {
      throw new AppError(DEVICE_ERRORS.INVALID_OWNER_TYPE);
    }

    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      throw new AppError(DEVICE_ERRORS.DEVICE_ALREADY_EXISTS);
    }

    const existingName = await Device.findOne({ deviceName, ownerId });
    if (existingName) {
      throw new AppError(DEVICE_ERRORS.NAME_ALREADY_EXISTS);
    }

    devCode = DolynkCrypto.encodeDevCode(devCode);

    await DolynkClient.addDevice(deviceId, devCode);

    const pack = new Device({
      ownerId,
      deviceId,
      deviceName,
      devCode,
    });

    return pack.save();
  }

  // =============================
  // UPDATE
  // =============================

  static async updateDeviceNames(
    updates: { deviceId: string; deviceName: string }[]
  ) {
    return Promise.all(
      updates.map(({ deviceId, deviceName }) =>
        Device.updateOne({ deviceId }, { $set: { deviceName } })
      )
    );
  }

  static async updateUrgencyNumber(deviceId: string, urgencyNumber?: string) {
    const pack = await Device.findOneAndUpdate(
      { deviceId },
      { urgencyNumber: urgencyNumber ?? "17" },
      { new: true }
    );

    if (!pack) {
      throw new AppError(DEVICE_ERRORS.DEVICE_NOT_FOUND);
    }

    return pack;
  }

  static async update(
    deviceId: string,
    fields: { urgencyNumber?: string; deviceName?: string }
  ) {
    const device = await Device.findOneAndUpdate(
      { deviceId },
      { $set: fields },
      { new: true }
    );

    if (!device) {
      throw new AppError(DEVICE_ERRORS.DEVICE_NOT_FOUND);
    }

    return device;
  }

  // =============================
  // READ
  // =============================

  static async findAll() {
    return Device.find();
  }

  static async findAllByOwner(ownerId: string) {
    return Device.find({ ownerId });
  }

  static async findByDeviceId(deviceId: string) {
    const device = await Device.findOne({ deviceId });

    if (!device) {
      throw new AppError(DEVICE_ERRORS.DEVICE_NOT_FOUND);
    }

    return device;
  }

static async findAllAccess(userId: string) {
  const user = await User.findById(userId).select("ownerId userType").lean();
  if (!user) {
    throw new AppError(USER_ERRORS.USER_NOT_FOUND);
  }

  if (user.userType === USER_TYPE.MEMBER) {
    console.log("MEMBER", userId);
    return PackAccess.find({ userId })
      .populate("deviceId")
      .lean();
  }

  if (user.userType === USER_TYPE.OWNER) {
    console.log("OWNER", userId);
    const devices = await Device.find({ ownerId: userId })
    .lean();
    return devices.map(device => fromDevice(device, userId));
  }

  if (user.userType === USER_TYPE.ADMIN) {
    const devices = await Device.find({ ownerId: user.ownerId })
    .lean();
    return devices.map(device => fromDevice(device, userId));
  }
  return [];
}


  // =============================
  // PACK ACCESS
  // =============================

  static async addOrUpdateAccess(accessList: any[]) {
    const results = [];

    for (const item of accessList) {
      const { userId, deviceId, hasAccess, access } = item;

      if (!userId || !deviceId || typeof hasAccess !== "boolean") {
        throw new AppError(DEVICE_ERRORS.INVALID_DEVICE_ACCESS_PAYLOAD);
      }

      let packAccess = await PackAccess.findOne({ userId, deviceId });

      if (packAccess) {
        packAccess.hasAccess = hasAccess;
        packAccess.access = access;
        await packAccess.save();
        results.push({ status: "updated", deviceId });
      } else {
        await PackAccess.create({ userId, deviceId, hasAccess, access });
        results.push({ status: "created", deviceId });
      }
    }

    return results;
  }

  static async setAreaArmMode(deviceId: string, isArmed: boolean) {
    return await DolynkClient.setAreaArmMode(deviceId, isArmed);
  }


static async getAreaArmMode(deviceId: string) {
  const response = await DolynkClient.getAreaArmMode(deviceId);

  const armModes = response.data.armModes;

  if (!Array.isArray(armModes) || armModes.length === 0) {
    throw new AppError(DEVICE_ERRORS.DEVICE_GET_AREA_ARM_FAILED);
  }

  const isArmed = armModes.some(
    (area) => area.mode === "T"
  );

  return {
    isArmed,
  };
}

static async getAccessoriesInfo(deviceId: string, accessoriesId: string[]) {
  return await DolynkClient.getAccessoriesInfo(deviceId,accessoriesId);
}

static async getPirCamSnapUrl(deviceId: string,accessoryId: string,channel: number)  {
  const response = await  DolynkClient.getPirCamSnapUrl(deviceId,accessoryId,channel);
  const picUrl = response.data.picUrl;
  return { picUrl };
}
}
