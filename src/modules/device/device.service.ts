import mongoose from 'mongoose';
import Pack from './device.model';
import PackAccess from './deviceAccess.model';
import User from '../user/user.model';

import { AppError } from "../../core/errors/app.error";
import { DEVICE_ERRORS } from "./device.errors";
import { DolynkClient } from '../../shared/integrations/dolynk/dolynk.client';
import { DolynkCrypto } from '../../shared/integrations/dolynk/dolynk.crypto';

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

    const existingDevice = await Pack.findOne({ deviceId });
    if (existingDevice) {
      throw new AppError(DEVICE_ERRORS.DEVICE_ALREADY_EXISTS);
    }

    devCode = DolynkCrypto.encodeDevCode(devCode);

    await DolynkClient.addDevice(deviceId, devCode);

    const pack = new Pack({
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
        Pack.updateOne({ deviceId }, { $set: { deviceName } })
      )
    );
  }

  static async updateUrgencyNumber(deviceId: string, urgencyNumber?: string) {
    const pack = await Pack.findOneAndUpdate(
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
    const device = await Pack.findOneAndUpdate(
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
    return Pack.find();
  }

  static async findAllByOwner(ownerId: string) {
    return Pack.find({ ownerId });
  }

  static async findByDeviceId(deviceId: string) {
    const device = await Pack.findOne({ deviceId });

    if (!device) {
      throw new AppError( DEVICE_ERRORS.DEVICE_NOT_FOUND);
    }

    return device;
  }

  static async findAllAccessByUser(userId: string) {
    return PackAccess.find({ userId })
      .populate("packId")
      .lean();
  }

  // =============================
  // PACK ACCESS
  // =============================

  static async addOrUpdateAccess(accessList: any[]) {
    const results = [];

    for (const item of accessList) {
      const { userId, packId, hasAccess, access } = item;

      if (!userId || !packId || typeof hasAccess !== "boolean") {
        throw new AppError(DEVICE_ERRORS.INVALID_DEVICE_ACCESS_PAYLOAD);
      }

      let packAccess = await PackAccess.findOne({ userId, packId });

      if (packAccess) {
        packAccess.hasAccess = hasAccess;
        packAccess.access = access;
        await packAccess.save();
        results.push({ status: "updated", packId });
      } else {
        await PackAccess.create({ userId, packId, hasAccess, access });
        results.push({ status: "created", packId });
      }
    }

    return results;
  }

  static async setAreaArmMode(deviceId: string, armingMode: string) {
    return await DolynkClient.setAreaArmMode(deviceId, armingMode);
  }

  static async getAreaArmMode(deviceId: string) {
    return await DolynkClient.getAreaArmMode(deviceId);
  }
}
