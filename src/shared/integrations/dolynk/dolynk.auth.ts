import axios from "axios";
import { DOLYNK_CONFIG } from "../../config/dolynk.config";
import { DolynkHeaders } from "./dolynk.headers";

import { DEVICE_ERRORS } from "../../../modules/device/device.errors";
import { AppError } from "../../../core/errors/app.error";

let cachedToken: string | null = null;
let tokenExpiration: number | null = null;



export class DolynkAuthService {
  static async getAccessToken(): Promise<string> {
    if (
      typeof cachedToken === "string" &&
      typeof tokenExpiration === "number" &&
      Date.now() < tokenExpiration
    ) {
      return cachedToken;
    }

    const headers = DolynkHeaders.generate();

    try {
      const response = await axios.post(
        `${DOLYNK_CONFIG.BASE_URL}/open-api/api-base/auth/getAppAccessToken`,
        {},
        { headers }
      );

      const data = response.data;

      if (!data.success || !data.data?.appAccessToken) {
        throw new AppError(DEVICE_ERRORS.DOLYNK_AUTH_FAILED);
      }

      const token: string = data.data.appAccessToken;

      cachedToken = token;

      // Refresh 1 minute before expiration
      tokenExpiration =
        Date.now() + data.data.validitySeconds * 1000 - 60000;

      return token;
    } catch (error) {
      throw new AppError(DEVICE_ERRORS.DOLYNK_AUTH_FAILED);
    }
  }
}