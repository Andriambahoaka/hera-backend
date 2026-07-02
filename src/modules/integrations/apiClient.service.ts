import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import ApiClient from "./apiClient.model";

export const generateAccessToken = (clientId: string) => {
  return jwt.sign(
    { clientId, type: "client" },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );
};

export const createApiClient = async (name: string) => {
  const clientId = crypto.randomBytes(16).toString("hex");
  const clientSecret = crypto.randomBytes(32).toString("hex");

  const clientSecretHash = await bcrypt.hash(clientSecret, 12);

  await ApiClient.create({
    clientId,
    clientSecretHash,
    name,
  });

  return {
    clientId,
    clientSecret, 
  };
};
