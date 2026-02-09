import mongoose from 'mongoose';
import Pack from '../models/pack.model';
import PackAccess from '../models/packAccess.model';
import User from '../models/user.model';
import { PackErrors } from '../errors';

export class PackService {
  static async createPack(data: {
    ownerId: string;
    deviceId: string;
    deviceName: string;
    devicePassword: string;
  }) {
    const { ownerId, deviceId, deviceName, devicePassword } = data;

    if (!mongoose.Types.ObjectId.isValid(ownerId)) {
      throw new PackErrors.InvalidOwnerIdError();
    }

    const owner = await User.findById(ownerId);
    if (!owner) {
      throw new PackErrors.OwnerNotFoundError();
    }

    if (owner.userType === 2 || owner.userType === 3) {
      throw new PackErrors.InvalidOwnerTypeError();
    }

    const existingPack = await Pack.findOne({ deviceId });
    if (existingPack) {
      throw new PackErrors.DeviceAlreadyExistsError();
    }

    const pack = new Pack({
      ownerId,
      deviceId,
      deviceName,
      devicePassword,
    });

    return pack.save();
  }

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
    return Pack.findOneAndUpdate(
      { deviceId },
      { urgencyNumber: urgencyNumber ?? '17' },
      { new: true }
    );
  }

  static async findByDeviceId(deviceId: string) {
    return Pack.findOne({ deviceId });
  }

  static async updatePack(
    deviceId: string,
    fields: { urgencyNumber?: string; deviceName?: string }
  ) {
    return Pack.findOneAndUpdate(
      { deviceId },
      { $set: fields },
      { new: true }
    );
  }

  static async findAll() {
    return Pack.find();
  }

  static async findAllByOwner(ownerId: string) {
    return Pack.find({ ownerId });
  }

  static async addOrUpdatePackAccess(accessList: any[]) {
    const results = [];

    for (const item of accessList) {
      const { userId, packId, hasAccess, access } = item;

      if (!userId || !packId || typeof hasAccess !== 'boolean') {
        results.push({ status: 'error', packId });
        continue;
      }

      let packAccess = await PackAccess.findOne({ userId, packId });

      if (packAccess) {
        packAccess.hasAccess = hasAccess;
        packAccess.access = access;
        await packAccess.save();
        results.push({ status: 'updated', packId });
      } else {
        await PackAccess.create({ userId, packId, hasAccess, access });
        results.push({ status: 'created', packId });
      }
    }

    return results;
  }

  static async findAllPackAccessByUser(userId: string) {
    return PackAccess.find({ userId })
      .populate('packId')
      .lean();
  }
}
