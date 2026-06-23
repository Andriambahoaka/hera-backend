import axios from "axios";
import { AppError } from "../../../core/errors/app.error";
import { DolynkAuthService } from "./dolynk.auth";
import { DolynkHeaders } from "./dolynk.headers";
import { DOLYNK_CONFIG } from "../../config/dolynk.config";
export class DolynkApi {
  static async postRequest<T>(
    endpoint: string,
    payload: object,
    errorMap: Record<string, Error>
  ): Promise<T> {
    const appAccessToken = await DolynkAuthService.getAccessToken();
    const body = JSON.stringify(payload);

    const headers = DolynkHeaders.generate(body, appAccessToken);

        console.log(`${DOLYNK_CONFIG.BASE_URL}/open-api/${endpoint}`);

    try {
      const response = await axios.post(
        `${DOLYNK_CONFIG.BASE_URL}/open-api/${endpoint}`,
        payload,
        { headers }
      );

      const data = response.data;
      console.log(data);

      if (data.success === true) {
        return data;
      }

      const mappedError = errorMap[data.code] ?? errorMap["default"];
      throw mappedError;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw errorMap["default"];
    }
  }
}
