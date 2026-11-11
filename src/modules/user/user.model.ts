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
  onboardingCompleted: boolean;
  devicesToken: string[];
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // Never loaded unless asked for with .select("+password") (login, password change).
  password: { type: String, required: true, select: false },
  phoneNumber: { type: String },
  userType: { type: Number, required: true },
  ownerId: { type: String, default: null },
  firstLogin: { type: Boolean, default: true },
  onboardingCompleted: {
    type: Boolean,
    default: false
  },
  // FCM push tokens: server-side only. Load with .select("devicesToken") when sending pushes.
  devicesToken: { type: [{ type: String }], select: false },
  imageUrl: { type: String, default: null },
  imagePublicId: { type: String, default: null }
}, {
  // Also strip the hash and push tokens from documents that loaded them (e.g. right after save()).
  toJSON: {
    transform: (_doc, ret: Record<string, unknown>) => {
      delete ret.password;
      delete ret.devicesToken;
      return ret;
    },
  },
});

userSchema.plugin(uniqueValidator);

export default mongoose.model<IUser>('User', userSchema);
