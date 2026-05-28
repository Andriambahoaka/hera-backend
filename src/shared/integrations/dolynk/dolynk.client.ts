import { AppError } from "../../../core/errors/app.error";
import { DEVICE_ERRORS } from "../../../modules/device/device.errors";
import Device from "../../../modules/device/device.model";

import { DolynkApi } from "./dolynk.api";
import {   DolynkResponse,GetAreaArmModeData, GetPicCamSnapUrlData } from "./dolynk.types";

export class DolynkClient {
static async addDevice(deviceId: string, deviceCode: string) {
  const payload = {
    deviceId,
    categoryCode: "ARC",
    devCode: deviceCode,
  };

  return DolynkApi.postRequest(
    "addDevice",
    payload,
    {
      IDV001: new AppError(DEVICE_ERRORS.DEVICE_NOT_EXIST),
      IDV002: new AppError(DEVICE_ERRORS.DEVICE_OFFLINE),
      IDV006: new AppError(DEVICE_ERRORS.DEVICE_PASSWORD_INCORRECT),
      PRM0132: new AppError(DEVICE_ERRORS.INVALID_DEVICE_PRODUCT),
      default: new AppError(DEVICE_ERRORS.DEVICE_ADD_FAILED)
    }
  );
}

static async setAreaArmMode(deviceId: string, isArmed: boolean) {
  const device = await Device.findOne({ deviceId }, { devCode: 1 });
  const encodedDevCode = device?.devCode;
  const areaIds = Array.from({ length: 32 }, (_, i) => i + 1);
  const armingMode = isArmed ? "T" : "D";

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
    "alarm/setAreaArmMode",
    payload,
    {
      IDV002: new AppError(DEVICE_ERRORS.DEVICE_OFFLINE),
      default: new AppError(DEVICE_ERRORS.DEVICE_SET_AREA_ARM_FAILED)
    }
  );
}

static async getAreaArmMode(deviceId: string) : Promise<DolynkResponse<GetAreaArmModeData>> {
  return DolynkApi.postRequest(
    "alarm/getAreaArmMode",
    { deviceId },
    {
      IDV002: new AppError(DEVICE_ERRORS.DEVICE_OFFLINE),
      default: new AppError(DEVICE_ERRORS.DEVICE_GET_AREA_ARM_FAILED)
    }
  );
}

static async getAccessoriesInfo(deviceId: string, accessoriesId: string[]) {
  return DolynkApi.postRequest(
    "alarm/getAccessoryInfo",
    { deviceId, accessoriesId },
    {
      IDV002: new AppError(DEVICE_ERRORS.DEVICE_OFFLINE),
      default: new AppError(DEVICE_ERRORS.DEVICE_GET_ACCESSORIES_INFO_FAILED)
    }
  );
}

static async getPirCamSnapUrl(deviceId: string,accessoryId: string,channel: number): Promise<DolynkResponse<GetPicCamSnapUrlData>> {
  return DolynkApi.postRequest(
    "alarm/getPirCamSnapUrl",
    { deviceId, accessoryId, channel },
    {
      IDV002: new AppError(DEVICE_ERRORS.DEVICE_OFFLINE),
      default: new AppError(DEVICE_ERRORS.DEVICE_GET_PIR_CAM_SNAP_URL_FAILED)
    }
  );
}
}