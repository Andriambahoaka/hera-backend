import { DOLYNK_CONFIG } from "../../config/dolynk.config";
import { DolynkCrypto } from "./dolynk.crypto";

export class DolynkHeaders {
  static generate(body = "", appAccessToken?: string) {
    const timestamp = Date.now().toString();
    const nonce = DolynkCrypto.generateNonce();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept-Language": "en",
      Version: "v1",
      Timestamp: timestamp,
      Nonce: nonce,
      AccessKey: DOLYNK_CONFIG.ACCESS_KEY,
      ProductId: DOLYNK_CONFIG.PRODUCT_ID,
      "X-TraceId-Header": DolynkCrypto.generateTraceId(),
    };

    // Add token only if present
    if (appAccessToken) {
      headers["AppAccessToken"] = appAccessToken;
    }

    const bodyHash = body
      ? DolynkCrypto.sha512(body.replace(/\s+/g, ""))
      : "";

    const prefix = appAccessToken
      ? `${DOLYNK_CONFIG.ACCESS_KEY}${appAccessToken}${timestamp}${nonce}`
      : `${DOLYNK_CONFIG.ACCESS_KEY}${timestamp}${nonce}`;

    const stringToSign = bodyHash
      ? `${prefix}POST\n${bodyHash}`
      : `${prefix}POST`;

    headers["Sign"] = DolynkCrypto.hmacSHA512(
      stringToSign,
      DOLYNK_CONFIG.SECRET_ACCESS_KEY
    );

    return headers;
  }
}