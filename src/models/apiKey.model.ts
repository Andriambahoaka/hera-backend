// models/ApiKey.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IApiKey extends Document {
  key: string;
  refreshKey: string;
  expiresAt?: Date;
  createdAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>({
  key: { type: String, required: true },
  refreshKey: { type: String, required: true },
  expiresAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IApiKey>('ApiKey', ApiKeySchema);
