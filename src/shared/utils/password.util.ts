
import crypto from "crypto";
export const generateTempPassword = (length = 12): string => {
  return crypto.randomBytes(length).toString("base64").slice(0, length);
};