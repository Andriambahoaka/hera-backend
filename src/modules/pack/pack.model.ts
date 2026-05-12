import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPack extends Document {
  ownerId: Types.ObjectId;
  deviceId: string;
  deviceName: string;
  devCode: string;
  urgencyNumber: string;
}

const packSchema = new Schema<IPack>(
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
    devCode: {
      type: String,
      required: true,
    },
    urgencyNumber: {
      type: String,
      default: '17',
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPack>('Pack', packSchema);

