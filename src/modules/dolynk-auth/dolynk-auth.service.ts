import axios from "axios";
import { DOLYNK_CONFIG } from "../../shared/config/dolynk.config";
import { DolynkHeaders } from "../../shared/integrations/dolynk/dolynk.headers";

export class DolynkAuthService {
  static async generateClientHeaders() {
    const tokenResponse = await axios.post(
      `${DOLYNK_CONFIG.BASE_URL}/open-api/api-base/auth/getAppAccessToken`,
      {},
      {
        headers: DolynkHeaders.generate(),
      }
    );

    const appAccessToken = tokenResponse.data.data.appAccessToken;

 
    const timestamp = Date.now().toString();
    const nonce = Math.floor(Math.random() * 999999).toString();

    return {
      productID: DOLYNK_CONFIG.PRODUCT_ID,
      accessKey: DOLYNK_CONFIG.ACCESS_KEY,
      appAccessToken,
      timestamp,
      nonce,
    };
  }
}