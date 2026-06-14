// models/Notification.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IPack {
  _id: mongoose.Types.ObjectId;
  deviceName: string;
  ownerId: mongoose.Types.ObjectId;
}

export interface INotification extends Document {
  pack: IPack;
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
}

const notificationSchema = new Schema<INotification>({
  pack: {
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
}, {
  timestamps: true
});

export default mongoose.model<INotification>('Notification', notificationSchema);
