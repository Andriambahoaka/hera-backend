// models/Activity.ts

import mongoose, { Document, Schema } from "mongoose";

export enum ActivityType {
  ADD_MEMBER = "addMember",
  DELETE_MEMBER = "deleteMember",
  UPDATE_ACCESS = "updateAccess",
  UPDATE_ROLE = "updateRole",
  ARMED = "armed",
  DISARMED = "disarmed",
}

export interface IActivity extends Document {
  ownerId: mongoose.Types.ObjectId;

  type: ActivityType;

  actor: {
    _id: mongoose.Types.ObjectId;
    name: string;
  };

  targetUser?: {
    _id: mongoose.Types.ObjectId;
    name: string;
  };

  targetDevice?: {
    _id: mongoose.Types.ObjectId;
    deviceName: string;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

const activitySchema = new Schema<IActivity>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: Object.values(ActivityType),
      required: true,
    },

    actor: {
      _id: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },

    targetUser: {
      _id: Schema.Types.ObjectId,
      name: String,
    },

    targetDevice: {
      _id: Schema.Types.ObjectId,
      deviceName: String,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

export default mongoose.model<IActivity>("Activity", activitySchema);