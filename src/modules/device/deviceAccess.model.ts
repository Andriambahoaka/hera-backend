import mongoose, { Schema, Document, Types } from 'mongoose';

export enum AccessLevel {
  NONE = 0,      // no access
  BASIC = 1,     // arm / disarm
  STANDARD = 2,  // + notifications and emergency call
  ADMIN = 3,     // + settings, user management
}

const ACCESS_LEVELS = Object.values(AccessLevel).filter(
  (v): v is AccessLevel => typeof v === 'number'
);

export interface IDeviceAccess extends Document {
  userId: Types.ObjectId;
  device: Types.ObjectId;
  accessLevel: AccessLevel;
  createdAt: Date;
  updatedAt: Date;
}

const deviceAccessSchema = new Schema<IDeviceAccess>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    device: {
      type: Schema.Types.ObjectId,
      ref: 'Device',
      required: true
    },
    accessLevel: {
      type: Number,
      enum: ACCESS_LEVELS,
      default: AccessLevel.NONE,
      required: true
    }
  },
  { timestamps: true }
);

deviceAccessSchema.index({ userId: 1, device: 1 }, { unique: true });

deviceAccessSchema.index({ device: 1 });

export default mongoose.model<IDeviceAccess>('DeviceAccess', deviceAccessSchema);




