import mongoose from 'mongoose';
import Device from './device.model';
import User from '../user/user.model';

import { AppError } from "../../core/errors/app.error";
import { DEVICE_ERRORS } from "./device.errors";
import { DolynkClient } from '../../shared/integrations/dolynk/dolynk.client';
import { DolynkCrypto } from '../../shared/integrations/dolynk/dolynk.crypto';
import { USER_TYPE } from '../user/enums/userType.enum';
import { fromDevice } from './utils/deviceAccessFactory';
import { USER_ERRORS } from '../user/user.errors';
import { ImageInfo } from '../../shared/integrations/dolynk/dolynk.types';
import { UserService } from '../user/user.service';
import DeviceAccess from './deviceAccess.model';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enums/notificationType.enum';
import { ActivityService } from '../activity/activity.service';
import { ActivityType } from '../activity/activity.model';


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

    if (owner.userType === USER_TYPE.MEMBER || owner.userType === USER_TYPE.ADMIN) {
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

  static async addAccessory(
    deviceId: string,
    accessoryInfo: {
      id: string;
      areaId?: number;
      name?: string;
      model?: string;
    }
  ) {
    if (!deviceId) {
      throw new AppError(DEVICE_ERRORS.MISSING_DEVICE_ID_FIELD);
    }

    const device = await Device.findOne({ deviceId });
    if (!device) {
      throw new AppError(DEVICE_ERRORS.DEVICE_NOT_FOUND);
    }

    return await DolynkClient.addAccessory(deviceId, accessoryInfo);

  }

  // =============================
  // UPDATE
  // =============================

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

  static async findAllByOwner(userId: string) {
    const user = await User.findById(userId)
      .select("_id ownerId")
      .lean();

    if (!user) {
      throw new AppError(USER_ERRORS.USER_NOT_FOUND);
    }

    const ownerId = user.ownerId ?? user._id.toString();
    return Device.find({ ownerId });
  }

  static async findByDeviceId(deviceId: string) {
    const device = await Device.findOne({ deviceId });

    if (!device) {
      throw new AppError(DEVICE_ERRORS.DEVICE_NOT_FOUND);
    }

    return device;
  }

  static async findGrantedAccess(userId: string) {
    const user = await User.findById(userId)
      .select("ownerId userType")
      .lean();

    if (!user) {
      throw new AppError(USER_ERRORS.USER_NOT_FOUND);
    }

    if (user.userType === USER_TYPE.MEMBER || user.userType === USER_TYPE.ADMIN) {
      const accesses = await DeviceAccess.find({
        userId,
        access: { $exists: true, $ne: [] },
      })
        .populate("device")
        .lean();

      return accesses.map(access => ({
        ...access,
        hasAccess: true,
      }));
    }

    const ownerId =
      user.userType === USER_TYPE.OWNER
        ? userId
        : user.ownerId;

    if (user.userType === USER_TYPE.OWNER) {
      const devices = await Device.find({ ownerId }).lean();

      return devices.map(device => ({
        ...fromDevice(device, userId),
        hasAccess: true,
      }));
    }

    return [];
  }

  static async findAccessibleDevices(userId: string) {
    const user = await User.findById(userId)
      .select("ownerId userType")
      .lean();

    if (!user) {
      throw new AppError(USER_ERRORS.USER_NOT_FOUND);
    }

    const ownerId =
      user.userType != USER_TYPE.OWNER
        ? user.ownerId
        : userId;

    const [devices, deviceAccesses] = await Promise.all([
      Device.find({ ownerId }).lean(),
      DeviceAccess.find({ userId }).lean(),
    ]);


    const accessMap = new Map(
      deviceAccesses.map(access => [
        access.device.toString(),
        access,
      ]),
    );

    return devices.map(device => {
      const access = accessMap.get(device._id.toString());

      return {
        device,
        access: access?.access ?? [],
      };
    });
  }


  // =============================
  // DEVICE ACCESS
  // =============================

  static async addOrUpdateAccess(
    userId: string,
    deviceId: string,
    access: number[],
  ) {
    await UserService.findUserOrFail(userId);

    if (!deviceId) {
      throw new AppError(
        DEVICE_ERRORS.INVALID_DEVICE_ACCESS_PAYLOAD,
      );
    }

    if (!mongoose.Types.ObjectId.isValid(deviceId)) {
      throw new AppError(DEVICE_ERRORS.INVALID_DEVICE_ID);
    }

    if (!access.length) {
      await DeviceAccess.deleteOne({
        userId,
        device: deviceId,
      });

      return;
    }

    await DeviceAccess.findOneAndUpdate(
      {
        userId,
        device: deviceId,
      },
      {
        access,
      },
      {
        upsert: true,
        new: true,
      },
    );
  }

  static async addOrUpdateMultipleAccess(
    userId: string,
    accessList: any[],
  ) {
    await UserService.findUserOrFail(userId);

    await DeviceAccess.deleteMany({ userId });

    const documents = accessList
      .filter(item => item.access?.length)
      .map(item => ({
        userId,
        device: item.deviceId,
        access: item.access,
      }));

    if (documents.length) {
      await DeviceAccess.insertMany(documents);
    }
  }

  static async setAreaArmMode(deviceId: string, isArmed: boolean, userId: string) {
    const response = await DolynkClient.setAreaArmMode(deviceId, isArmed);

    const notificationDto = {
      deviceId,
      msgType: isArmed ? NotificationType.ARMED : NotificationType.DISARMED,
      userId: userId,
    };
    await NotificationService.createAndSend(notificationDto);
    const [user, device] = await Promise.all([
      User.findById(userId).select("name"),
      Device.findOne({ deviceId }).select("_id deviceName ownerId"),
    ]);

    if (user && device) {
      await ActivityService.addActivity({
        ownerId: device.ownerId.toString(),

        type: isArmed
          ? ActivityType.ARMED
          : ActivityType.DISARMED,

        actor: {
          _id: user._id.toString(),
          name: user.name,
        },

        targetDevice: {
          _id: device._id.toString(),
          deviceName: device.deviceName,
        },
      });
    }

    return response;
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
    const response = await DolynkClient.getAccessoriesInfo(deviceId, accessoriesId);
    return response.data.accessoryInfos;
  }

  static async getAccessoryStatus(deviceId: string, accessoriesId: string[]) {
    const { data } = await DolynkClient.getAccessoryStatus(
      deviceId,
      accessoriesId,
    );

    const status = data?.accessoryStatus?.[0];

    return status;
  }

  static async getPirCamSnapUrl(deviceId: string, accessoryId: string, channel: number) {
    const response = await DolynkClient.getPirCamSnapUrl(deviceId, accessoryId, channel);
    const picUrl = response.data.picUrl;
    return { picUrl };
  }

  static async setAccessory(deviceId: string, id: string, name: string | null, type: string, sensitivity: number | null, volume: number | null, entryDelay: number | null, imageInfo: ImageInfo | null = null) {
    return DolynkClient.setAccessory(deviceId, id, name, type, sensitivity, volume, entryDelay, imageInfo);
  }

}
