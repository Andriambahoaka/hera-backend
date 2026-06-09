import { AppError } from "../../../core/errors/app.error";
import { COMMON_ERRORS } from "../../../core/errors/common.error";
import { DEVICE_ERRORS } from "../../../modules/device/device.errors";
import Device from "../../../modules/device/device.model";
import { ACCESSORY_ENDPOINTS, ALARM_SEGMENT, DEVICE_SEGMENT } from "./constants/dolynk.endpoints";

import { DolynkApi } from "./dolynk.api";
import {   AccessoryInfo, AccessoryStatus, DolynkResponse,GetAreaArmModeData, GetPicCamSnapUrlData, ImageInfo } from "./dolynk.types";

export class DolynkClient {
static async addDevice(deviceId: string, deviceCode: string) {
  const payload = {
    deviceId,
    categoryCode: "ARC",
    devCode: deviceCode,
  };

  return DolynkApi.postRequest(
    `/${DEVICE_SEGMENT}/addDevice`,
    payload,
    {
      IDV001: new AppError(DEVICE_ERRORS.DEVICE_NOT_EXIST),
      IDV002: new AppError(DEVICE_ERRORS.DEVICE_OFFLINE),
      IDV006: new AppError(DEVICE_ERRORS.DEVICE_PASSWORD_INCORRECT),
      IDV0034: new AppError(DEVICE_ERRORS.INVALID_CREDENTIALS),
      PRM0132: new AppError(DEVICE_ERRORS.INVALID_DEVICE_PRODUCT),
      default: new AppError(DEVICE_ERRORS.DEVICE_ADD_FAILED)
    }
  );
}

static async setAreaArmMode(deviceId: string, isArmed: boolean) {
  const device = await Device.findOne({ deviceId }, { devCode: 1 });
  const encodedDevCode = device?.devCode;
  const areaIds = Array.from({ length: 32 }, (_, i) => i + 1);
  console.log(isArmed);
  const armingMode = isArmed ? "T" : "D";
  console.log(armingMode);


  const payload = {
    deviceId,
    devCode: encodedDevCode,
    armMode: armingMode,
    areaIds,
    armOptions: {
      profile: "Force",
      triggerId: "hera",
      triggerName: "hera",
      clientAddress: "127.0.0.1"
    }
  };

  return DolynkApi.postRequest(
    `/${ALARM_SEGMENT}/setAreaArmMode`,
    payload,
    {
      IDV002: new AppError(DEVICE_ERRORS.DEVICE_OFFLINE),
      default: new AppError(DEVICE_ERRORS.DEVICE_SET_AREA_ARM_FAILED)
    }
  );
}

static async getAreaArmMode(deviceId: string) : Promise<DolynkResponse<GetAreaArmModeData>> {
  return DolynkApi.postRequest(
    `/${ALARM_SEGMENT}/getAreaArmMode`,
    { deviceId },
    {
      IDV002: new AppError(DEVICE_ERRORS.DEVICE_OFFLINE),
      default: new AppError(DEVICE_ERRORS.DEVICE_GET_AREA_ARM_FAILED)
    }
  );
}

static async getAccessoriesInfo(deviceId: string, accessoriesId: string[]): Promise<DolynkResponse<AccessoryInfo>> {
  return DolynkApi.postRequest(
    `/${ALARM_SEGMENT}/getAccessoryInfo`,
    { deviceId, accessoriesId },
    {
      IDV002: new AppError(DEVICE_ERRORS.DEVICE_OFFLINE),
      default: new AppError(DEVICE_ERRORS.DEVICE_GET_ACCESSORIES_INFO_FAILED)
    }
  );
}

static async getAccessoryStatus(deviceId: string, accessoriesId: string[]): Promise<DolynkResponse<AccessoryStatus>> {
  return DolynkApi.postRequest(
    `/${ALARM_SEGMENT}/getAccessoryStatus`,
    { deviceId, accessoriesId },
    {
      default: new AppError(COMMON_ERRORS.INTERNAL_SERVER_ERROR)
    }
  );
}

static async getPirCamSnapUrl(deviceId: string,accessoryId: string,channel: number): Promise<DolynkResponse<GetPicCamSnapUrlData>> {
  return DolynkApi.postRequest(
    `/${ALARM_SEGMENT}/getPirCamSnapUrl`,
    { deviceId, accessoryId, channel },
    {
      IDV002: new AppError(DEVICE_ERRORS.DEVICE_OFFLINE),
      default: new AppError(DEVICE_ERRORS.DEVICE_GET_PIR_CAM_SNAP_URL_FAILED)
    }
  );
}

static async setAccessory(
  deviceId: string,
  id  : string,
  name: string | null,
  type: string,
  sensitivity: number | null,
  volume: number | null,
  entryDelay: number | null,
  imageInfo: ImageInfo | null = null,
) {
  
 const accessoryPath = ACCESSORY_ENDPOINTS[type as keyof typeof ACCESSORY_ENDPOINTS];

  if (!accessoryPath) {
    throw new AppError(DEVICE_ERRORS.ACCESSORY_NOT_SUPPORTED);
  }

  const accessoryInfos = Object.fromEntries(
    Object.entries({
      id,
      name,
      sensentivity: sensitivity,
      volume,
      entryDelay,
      imageInfo,
    }).filter(([, value]) => value != null),
  );

  return DolynkApi.postRequest(
    accessoryPath,
    {
      deviceId,
      accessoryId: id,
      accessoryInfos,
    },
    {
      PRM001: new AppError(DEVICE_ERRORS.ACCESSORY_NOT_SUPPORTED),
      IDV002: new AppError(DEVICE_ERRORS.DEVICE_OFFLINE),
      default: new AppError(COMMON_ERRORS.INTERNAL_SERVER_ERROR),
    },
  );
}
}