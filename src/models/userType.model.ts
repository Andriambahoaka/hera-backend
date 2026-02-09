import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUserType extends Document {
  type_id: number;
  name: string;
}

const userTypeSchema: Schema<IUserType> = new Schema({
  type_id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
});

const UserType: Model<IUserType> = mongoose.model<IUserType>("UserType", userTypeSchema);

export default UserType;

