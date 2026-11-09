import mongoose from 'mongoose';
import Device, { IDevice } from './device.model';
import User from '../user/user.model';

import { AppError } from "../../core/errors/app.error";
import { DEVICE_ERRORS } from "./device.errors";
import { DolynkClient } from '../../shared/integrations/dolynk/dolynk.client';
import { DolynkCrypto } from '../../shared/integrations/dolynk/dolynk.crypto';
import { USER_TYPE } from '../user/enums/userType.enum';
import { USER_ERRORS } from '../user/user.errors';
import { ImageInfo } from '../../shared/integrations/dolynk/dolynk.types';
import { UserService } from '../user/user.service';
import DeviceAccess, { AccessLevel } from './deviceAccess.model';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/enums/notificationType.enum';
import { ActivityService } from '../activity/activity.service';
import { ActivityType } from '../activity/activity.model';
import { SUCCESS } from '../../core/utils/messages.util';
import { AccessRequest, DeviceWithAccess } from './device.type';
import { householdIdOf } from '../user/household';


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

    const device = new Device({
      ownerId,
      deviceId,
      deviceName,
      devCode,
    });

    return device.save();
  }

  static async addAccessory(
    deviceId: string,
    accessoryInfo: {
      id: string;
      name?: string;
      model?: string;
    }
  ) {

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

    if (user.userType === USER_TYPE.OWNER) {
      const devices = await Device.find({ ownerId: userId }).lean<IDevice[]>();

      return devices.map(device => ({
        device,
        accessLevel: AccessLevel.ADMIN,
      }));
    }

    if (user.userType === USER_TYPE.MEMBER || user.userType === USER_TYPE.ADMIN) {
      const accesses = await DeviceAccess.find({ userId })
        .populate<{ device: IDevice | null }>("device")
        .lean();

      return accesses
        .filter(a => a.device !== null)
        .map(a => ({
          device: a.device as IDevice,
          accessLevel: a.accessLevel,
        }));
    }


    return [];
  }

  static async findAccessibleDevices(userId: string): Promise<DeviceWithAccess[]> {
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
      DeviceAccess.find({ userId }).select("device accessLevel").lean(),
    ]);


    const accessMap = new Map(
      deviceAccesses.map(access => [
        access.device.toString(),
        access.accessLevel,
      ]),
    );

    return devices.map(device => {
      return {
        device,
        accessLevel: accessMap.get(device._id.toString()) ?? AccessLevel.NONE,
      };
    });
  }


  // =============================
  // DEVICE ACCESS
  // =============================

  private static assertValidLevel(level: unknown): asserts level is AccessLevel {
  if (!Object.values(AccessLevel).includes(level as AccessLevel)) {
    throw new AppError(DEVICE_ERRORS.INVALID_DEVICE_ACCESS_PAYLOAD);
  }
}

/**
 * Sets a user's access levels on devices of their household.
 * - default: only the listed devices change (level 0 removes access);
 * - replace: the list is the complete set, so any other existing access is removed
 *   (used by update-member, where the app sends only the checked devices).
 * Sends an "accessChanged" push for each device whose level changed, and
 * returns those changes.
 */
static async setMultipleAccess(
  userId: string | mongoose.Types.ObjectId,
  accessList: AccessRequest[],
  { replace = false }: { replace?: boolean } = {},
) {
  const user = await UserService.findUserOrFail(userId.toString());

  for (const { deviceId, accessLevel } of accessList) {
    if (!mongoose.Types.ObjectId.isValid(deviceId)) {
      throw new AppError(DEVICE_ERRORS.INVALID_DEVICE_ID);
    }
    this.assertValidLevel(accessLevel);
  }

  if (!accessList.length && !replace) return [];

  // Every listed device must belong to the user's household.
  const requestedIds = [...new Set(accessList.map((a) => String(a.deviceId)))];
  if (requestedIds.length) {
    const count = await Device.countDocuments({
      _id: { $in: requestedIds },
      ownerId: householdIdOf(user),
    });
    if (count !== requestedIds.length) {
      throw new AppError(DEVICE_ERRORS.DEVICE_NOT_FOUND);
    }
  }

  const previous = await DeviceAccess.find({
    userId: user._id,
    ...(replace ? {} : { device: { $in: requestedIds } }),
  })
    .select("device accessLevel")
    .lean();
  const previousLevel = new Map(previous.map((a) => [a.device.toString(), a.accessLevel]));

  const finalLevel = new Map<string, AccessLevel>(
    accessList.map((a) => [String(a.deviceId), a.accessLevel])
  );
  if (replace) {
    for (const id of previousLevel.keys()) {
      if (!finalLevel.has(id)) finalLevel.set(id, AccessLevel.NONE);
    }
  }

  const changedIds = [...finalLevel.keys()].filter(
    (id) => (previousLevel.get(id) ?? AccessLevel.NONE) !== finalLevel.get(id)
  );
  if (!changedIds.length) return [];

  await DeviceAccess.bulkWrite(
    changedIds.map((id) =>
      finalLevel.get(id) === AccessLevel.NONE
        ? { deleteOne: { filter: { userId: user._id, device: id } } }
        : {
            updateOne: {
              filter: { userId: user._id, device: id },
              update: { $set: { accessLevel: finalLevel.get(id)! } },
              upsert: true,
            },
          },
    ),
  );

  // Tell the member's app (devices deleted since are skipped).
  const devices = await Device.find({ _id: { $in: changedIds } }).select("_id deviceId").lean();
  const changes = devices.map((d) => ({
    deviceId: d.deviceId,
    accessLevel: finalLevel.get(d._id.toString())!,
  }));

  await NotificationService.sendAccessChanged(user._id, changes);
  return changes;
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

  static async getPirCamSnapUrl(deviceId: string, accessoryId: string, channel: number, userId: string) {
    const response = await DolynkClient.getPirCamSnapUrl(deviceId, accessoryId, channel);
    const picUrl = response.data.picUrl;
    const notificationDto = {
      deviceId,
      msgType: NotificationType.PHOTO_CAPTURED,
      userId: userId,
      filePath: picUrl,
    };
    await NotificationService.createAndSend(notificationDto);

    return { picUrl };
  }

  static async setAccessory(deviceId: string, id: string, name: string | null, type: string, sensitivity: number | null, volume: number | null, entryDelay: number | null, imageInfo: ImageInfo | null = null) {
    return DolynkClient.setAccessory(deviceId, id, name, type, sensitivity, volume, entryDelay, imageInfo);
  }

  static async deleteDevice(deviceId: string) {
    const device = await Device.findOne({ deviceId });

    if (!device) {
      throw new AppError(DEVICE_ERRORS.DEVICE_NOT_FOUND);
    }

    await Device.deleteOne({ deviceId });

    await DeviceAccess.deleteMany({
      deviceId: device._id,
    });


    return SUCCESS.PACK_DELETED;

  }

}
