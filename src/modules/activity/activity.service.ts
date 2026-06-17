import Activity from "./activity.model";
import { AppError } from "../../core/errors/app.error";
import { ACTIVITY_ERRORS } from "./activity.errors";
import User from "../user/user.model";
import { USER_ERRORS } from "../user/user.errors";
import { USER_TYPE } from "../user/enums/userType.enum";
import { ActivityType } from "./activity.model";

export class ActivityService {

static async addActivity(data: {
  ownerId: string;
  type: ActivityType;

  actor: {
    _id: string;
    name: string;
  };

  targetUser?: {
    _id: string;
    name: string;
  };

  targetDevice?: {
    _id: string;
    deviceName: string;
  };
}) {
  await Activity.create(data);

  return {
    message: "Activity created successfully",
  };
}


static async findActivitiesByDate(
  userId: string,
  date?: string,
  page: number = 1,
  limit: number = 20
) {
  const user = await User.findById(userId)
    .select("ownerId userType")
    .lean();

  if (!user) {
    throw new AppError(USER_ERRORS.USER_NOT_FOUND);
  }

  const ownerId =
    user.userType !== USER_TYPE.OWNER
      ? user.ownerId
      : userId;

  if (!ownerId) {
    throw new AppError(ACTIVITY_ERRORS.OWNER_ID_REQUIRED);
  }

  const skip = (page - 1) * limit;

  const query: any = {
    ownerId,
  };

  if (date) {
    const startDate = new Date(date);

    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);

    query.createdAt = {
      $gte: startDate,
      $lt: endDate,
    };
  }

  const [activities, total] = await Promise.all([
    Activity.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Activity.countDocuments(query),
  ]);

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      hasMore: skip + activities.length < total,
    },
  };
}

}