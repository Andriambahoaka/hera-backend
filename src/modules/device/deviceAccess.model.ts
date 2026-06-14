import mongoose, { Schema, Document, Types } from 'mongoose';


export interface IDeviceAccess extends Document {
  userId: Types.ObjectId;
  device: Types.ObjectId;
  hasAccess: boolean;
  access: number[];
}

const deviceAccessSchema = new Schema<IDeviceAccess>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    device: {
      type: Schema.Types.ObjectId,
      ref: 'Device',
    },
    access: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model<IDeviceAccess>('DeviceAccess', deviceAccessSchema);




