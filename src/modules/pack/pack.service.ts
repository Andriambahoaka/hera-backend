import mongoose from 'mongoose';
import Pack from './pack.model';
import PackAccess from './packAccess.model';
import User from '../user/user.model';

import { AppError } from "../../core/errors/app.error";
import { PACK_ERRORS } from "../pack/pack.errors";
import { DolynkClient } from '../../shared/integrations/dolynk/dolynk.client';

export class PackService {

  // =============================
  // CREATE
  // =============================
  static async createPack(data: {
    ownerId: string;
    deviceId: string;
    deviceName: string;
    devCode: string;
  }) {
    const { ownerId, deviceId, deviceName, devCode } = data;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      throw new AppError(PACK_ERRORS.INVALID_OWNER_ID);
    }

    const owner = await User.findById(ownerId);
    if (!owner) {
      throw new AppError(PACK_ERRORS.OWNER_NOT_FOUND);
    }

    if (owner.userType === 2 || owner.userType === 3) {
      throw new AppError(PACK_ERRORS.INVALID_OWNER_TYPE);
    }

    const existingPack = await Pack.findOne({ deviceId });
    if (existingPack) {
      throw new AppError(PACK_ERRORS.DEVICE_ALREADY_EXISTS);
    }

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
      throw new AppError(PACK_ERRORS.PACK_NOT_FOUND);
    }

    return pack;
  }

  static async updatePack(
    deviceId: string,
    fields: { urgencyNumber?: string; deviceName?: string }
  ) {
    const pack = await Pack.findOneAndUpdate(
      { deviceId },
      { $set: fields },
      { new: true }
    );

    if (!pack) {
      throw new AppError(PACK_ERRORS.PACK_NOT_FOUND);
    }

    return pack;
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
    const pack = await Pack.findOne({ deviceId });

    if (!pack) {
      throw new AppError(PACK_ERRORS.PACK_NOT_FOUND);
    }

    return pack;
  }

  static async findAllPackAccessByUser(userId: string) {
    return PackAccess.find({ userId })
      .populate("packId")
      .lean();
  }

  // =============================
  // PACK ACCESS
  // =============================

  static async addOrUpdatePackAccess(accessList: any[]) {
    const results = [];

    for (const item of accessList) {
      const { userId, packId, hasAccess, access } = item;

      if (!userId || !packId || typeof hasAccess !== "boolean") {
        throw new AppError(PACK_ERRORS.INVALID_PACK_ACCESS_PAYLOAD);
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
}
