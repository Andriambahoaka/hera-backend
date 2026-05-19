import axios from "axios";
import { DOLYNK_CONFIG } from "../../config/dolynk.config";
import { DolynkCrypto } from "./dolynk.crypto";
import { DolynkHeaders } from "./dolynk.headers";
import { AppError } from "../../../core/errors/app.error";
import { DEVICE_ERRORS } from "../../../modules/device/device.errors";
import { DolynkAuthService } from "./dolynk.auth";
import Pack from "../../../modules/device/device.model";

export class DolynkClient {
  static async addDevice(deviceId: string, deviceCode: string) {
    const appAccessToken = await DolynkAuthService.getAccessToken();

    const payload = {
      deviceId,
      categoryCode: "ARC",
      devCode: deviceCode,
    };

    const body = JSON.stringify(payload);

    const headers = DolynkHeaders.generate(
      body,
      appAccessToken
    );

    try {
      const response = await axios.post(
        `${DOLYNK_CONFIG.BASE_URL}/open-api/api-iot/device/addDevice`,
        payload,
        { headers }
      );

      const data = response.data;

      if (data.success === true) {
        return data;
      }

      switch (data.code) {

        case "IDV001":
          throw new AppError(DEVICE_ERRORS.DEVICE_NOT_EXIST);

        case "IDV002":
          throw new AppError(DEVICE_ERRORS.DEVICE_OFFLINE);

        case "IDV006":
          throw new AppError(DEVICE_ERRORS.DEVICE_PASSWORD_INCORRECT);

        case "PRM0132":
          throw new AppError(DEVICE_ERRORS.INVALID_DEVICE_PRODUCT);

        default:
          throw new AppError(DEVICE_ERRORS.DEVICE_ADD_FAILED);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(DEVICE_ERRORS.DEVICE_ADD_FAILED);
    }
  }



  static async setAreaArmMode(deviceId: string, armingMode: string) {
    const appAccessToken = await DolynkAuthService.getAccessToken();
    const pack = await Pack.findOne({ deviceId }, { devCode: 1 });
    const encodedDevCode = pack?.devCode;
    const areaIds: number[] = Array.from({ length: 32 }, (_, index) => index + 1);


    const payload = {
      deviceId,
      devCode: encodedDevCode,
      armMode: armingMode,
      areaIds: areaIds,
      armOptions: {
        profile: "Force",
        triggerId: "test",
        triggerName: "test",
        clientAddress: "127.0.0.1"
      }
    };

    const body = JSON.stringify(payload);

    const headers = DolynkHeaders.generate(
      body,
      appAccessToken
    );

    try {
      const response = await axios.post(
        `${DOLYNK_CONFIG.BASE_URL}/open-api/api-iot/device/alarm/setAreaArmMode`,
        payload,
        { headers }
      );

      const data = response.data;

      console.log("Set Area Arm Mode Response:", data);

      if (data.success === true) {
        return data;
      }

      switch (data.code) {

        case "IDV002":
          throw new AppError(DEVICE_ERRORS.DEVICE_OFFLINE);

        default:
          throw new AppError(DEVICE_ERRORS.DEVICE_SET_AREA_ARM_FAILED);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(DEVICE_ERRORS.DEVICE_SET_AREA_ARM_FAILED);
    }
  }

  static async getAreaArmMode(deviceId: string,) {
    const appAccessToken = await DolynkAuthService.getAccessToken();


    const payload = {
      deviceId
    };

    const body = JSON.stringify(payload);

    const headers = DolynkHeaders.generate(
      body,
      appAccessToken
    );

    try {
      const response = await axios.post(
        `${DOLYNK_CONFIG.BASE_URL}/open-api/api-iot/device/alarm/getAreaArmMode`,
        payload,
        { headers }
      );

      const data = response.data;
      console.log("Get Area Arm Mode Response:", data);

      if (data.success === true) {
        return data;
      }

      switch (data.code) {

        case "IDV002":
          throw new AppError(DEVICE_ERRORS.DEVICE_OFFLINE);

        default:
          throw new AppError(DEVICE_ERRORS.DEVICE_GET_AREA_ARM_FAILED);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(DEVICE_ERRORS.DEVICE_GET_AREA_ARM_FAILED);
    }
  }



}