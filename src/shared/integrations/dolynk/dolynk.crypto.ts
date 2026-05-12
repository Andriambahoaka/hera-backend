import crypto from "crypto";

export class DolynkCrypto {
  static encodeDevCode(password: string): string {
    const base64 = Buffer.from(password).toString("base64");
    return `Dolynk_${base64}`;
  }

  static sha512(input: string): string {
    return crypto.createHash("sha512").update(input).digest("hex");
  }

  static hmacSHA512(input: string, key: string): string {
    return crypto
      .createHmac("sha512", key)
      .update(input)
      .digest("hex")
      .toUpperCase();
  }

  static generateNonce(length = 16): string {
    return Array.from({ length }, () =>
      Math.floor(Math.random() * 10)
    ).join("");
  }

  static generateTraceId(): string {
    return crypto.randomUUID().replace(/-/g, "");
  }
}