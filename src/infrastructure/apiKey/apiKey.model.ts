// models/ApiKey.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IApiKey extends Document {
  key: string;
  refreshKey: string;
  expiresAt: Date;
}

const apiKeySchema = new Schema<IApiKey>({
  key: { type: String, required: true },
  refreshKey: { type: String, required: true },
  expiresAt: { type: Date, required: true },
},
  {
    timestamps: true,
  }
);

apiKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });


export default mongoose.model<IApiKey>('ApiKey', apiKeySchema);
