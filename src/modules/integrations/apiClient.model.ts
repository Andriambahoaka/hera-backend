// models/ApiClient.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IApiClient extends Document {
  clientId: string;
  clientSecretHash: string;
  name: string;
  active: boolean;
  createdAt: Date;
}

const apiClientSchema = new Schema<IApiClient>(
  {
    clientId: { type: String, required: true, unique: true },
    clientSecretHash: { type: String, required: true },
    name: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IApiClient>("ApiClient", apiClientSchema);