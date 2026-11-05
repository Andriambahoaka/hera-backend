import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IDevice extends Document {
  ownerId: Types.ObjectId;
  deviceId: string;
  deviceName: string;
  devCode: string;
  urgencyNumber: string;
}

const deviceSchema = new Schema<IDevice>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deviceId: {
      type: String,
      required: true,
      unique: true,
    },
    deviceName: {
      type: String,
      default: '',
    },
    // Encoded device password sent to Dolynk. Never returned by queries
    // unless explicitly requested with .select("+devCode").
    devCode: {
      type: String,
      required: true,
      select: false,
    },
    urgencyNumber: {
      type: String,
      default: '17',
    },
  },
  {
    timestamps: true,
    // Also strip devCode from documents that loaded it (e.g. right after save()).
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.devCode;
        return ret;
      },
    },
  }
);

export default mongoose.model<IDevice>('Device', deviceSchema);

