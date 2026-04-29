import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAccess {
  id: number;
  isSelected: boolean;
}

export interface IPackAccess extends Document {
  userId: Types.ObjectId;
  packId: Types.ObjectId;
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

const packAccessSchema = new Schema<IPackAccess>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    packId: {
      type: Schema.Types.ObjectId,
      ref: 'Pack',
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

export default mongoose.model<IPackAccess>('PackAccess', packAccessSchema);




