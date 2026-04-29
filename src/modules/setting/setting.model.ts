import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  setting_id: number;
  label: string;
  value: unknown;
}

const settingSchema = new Schema<ISetting>(
  {
    setting_id: {
      type: Number,
      required: true,
      unique: true,
    },
    label: {
      type: String,
      required: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ISetting>('Setting', settingSchema);

