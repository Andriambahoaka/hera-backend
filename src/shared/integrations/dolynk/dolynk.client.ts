import axios from "axios";
import { DOLYNK_CONFIG } from "../../config/dolynk.config";
import { DolynkCrypto } from "./dolynk.crypto";
import { DolynkHeaders } from "./dolynk.headers";
import { AppError } from "../../../core/errors/app.error";
import { PACK_ERRORS } from "../../../modules/pack/pack.errors";
import { DolynkAuthService } from "./dolynk.auth";

export class DolynkClient {
  static async addDevice(deviceId: string, deviceCode: string) {
    const appAccessToken = await DolynkAuthService.getAccessToken();
    const encodedDevCode = DolynkCrypto.encodeDevCode(deviceCode);

    const payload = {
      deviceId,
      categoryCode: "ARC",
      devCode: encodedDevCode,
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
          throw new AppError(PACK_ERRORS.DEVICE_NOT_EXIST);

        case "IDV002":
          throw new AppError(PACK_ERRORS.DEVICE_OFFLINE);

        case "IDV006":
          throw new AppError(PACK_ERRORS.DEVICE_PASSWORD_INCORRECT);

        case "PRM0132":
          throw new AppError(PACK_ERRORS.INVALID_DEVICE_PRODUCT);

        default:
          throw new AppError(PACK_ERRORS.DEVICE_ADD_FAILED);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(PACK_ERRORS.DEVICE_ADD_FAILED);
    }
  }
}