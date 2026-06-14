// models/Activity.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IActivity extends Document {
  ownerId: mongoose.Types.ObjectId;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface IActivityModel extends Model<IActivity> {
  findByDateAndOwner(dateStr: string, ownerId: mongoose.Types.ObjectId): Promise<IActivity[]>;
}

const activitySchema = new Schema<IActivity>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }
}, { timestamps: true });

activitySchema.statics.findByDateAndOwner = async function(dateStr: string, ownerId: mongoose.Types.ObjectId) {
  const date = new Date(dateStr);
  const nextDay = new Date(dateStr);
  nextDay.setDate(nextDay.getDate() + 1);

  return this.find({
    ownerId,
    createdAt: {
      $gte: date,
      $lt: nextDay
    }
  }).sort({ createdAt: -1 });
};

const Activity = mongoose.model<IActivity, IActivityModel>('Activity', activitySchema);
export default Activity;
