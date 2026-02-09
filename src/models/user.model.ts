// models/User.ts
import mongoose, { Document, Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  userType: number;
  ownerId?: string | null;
  firstLogin: boolean;
  devicesToken: string[];
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String },
  userType: { type: Number, required: true },
  ownerId: { type: String, default: null },
  firstLogin: { type: Boolean, default: true },
  devicesToken: [{ type: String }],
  imageUrl: { type: String, default: null },
  imagePublicId: { type: String, default: null }
});

userSchema.plugin(uniqueValidator);

export default mongoose.model<IUser>('User', userSchema);
