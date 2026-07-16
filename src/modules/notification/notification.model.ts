// models/Notification.ts
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDevice {
  _id: mongoose.Types.ObjectId;
  deviceName: string;
  ownerId: mongoose.Types.ObjectId;
}

export interface INotification {
  _id: Types.ObjectId;
  device: IDevice;
  accessKey?: string;
  productId?: string;
  category?: string;
  msgType?: string;
  deviceId?: string;
  channelId?: number;
  utcTime?: number;
  localTime?: number;
  filePath?: string;
  alarmType?: string;
  createdAt?: Date;
  updatedAt?: Date;
  userId?: Schema.Types.ObjectId;
}

const notificationSchema = new Schema<INotification>({
  device: {
    _id: { type: Schema.Types.ObjectId, required: true },
    deviceName: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, required: true },
  },
  accessKey: { type: String },
  productId: { type: String },
  category: { type: String },
  msgType: { type: String },
  deviceId: { type: String },
  channelId: { type: Number },
  utcTime: { type: Number },
  localTime: { type: Number },
  filePath: { type: String },
  alarmType: { type: String },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true
});

const NOTIFICATION_RETENTION_DAYS = 90;

notificationSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds:
      NOTIFICATION_RETENTION_DAYS * 24 * 60 * 60,
  }
);

export default mongoose.model<INotification>('Notification', notificationSchema);
