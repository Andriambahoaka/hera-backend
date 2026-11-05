import mongoose from "mongoose";
import { APP } from "../utils/messages.util";

export async function connectDatabase(uri: string): Promise<void> {
  await mongoose.connect(uri);
  console.log(APP.MONGO_CONNECTED);
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
