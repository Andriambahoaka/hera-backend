import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAccess {
  id: number;
  isSelected: boolean;
}

export interface IDeviceAccess extends Document {
  userId: Types.ObjectId;
  deviceId: String;
  hasAccess: boolean;
  access: IAccess[];
}

const accessSchema = new Schema<IAccess>(
  {
    id: { type: Number, required: true },
    isSelected: { type: Boolean, required: true },
  },
  { _id: false } 
);

const deviceAccessSchema = new Schema<IDeviceAccess>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    deviceId: {
      type: String
    },
    hasAccess: {
      type: Boolean,
      required: true,
    },
    access: {
      type: [accessSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IDeviceAccess>('DeviceAccess', deviceAccessSchema);




