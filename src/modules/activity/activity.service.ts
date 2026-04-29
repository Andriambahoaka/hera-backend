import Activity from "./activity.model";
import { AppError } from "../../core/errors/AppError";
import { ACTIVITY_ERRORS } from "./activity.errors";

export class ActivityService {

  static async addActivity(data: { ownerId?: string; content?: string }) {
    const { ownerId, content } = data;

    if (!content) {
      throw new AppError(ACTIVITY_ERRORS.CONTENT_REQUIRED);
    }

    const activity = new Activity({
      ownerId,
      content,
    });

    const saved = await activity.save();

    return {message: "Activity created successfully",};
  }

  static async findActivitiesByDate(query: {
    ownerId?: string;
    date?: string;
  }) {
    const { ownerId, date } = query;

    if (!ownerId) {
      throw new AppError(ACTIVITY_ERRORS.OWNER_ID_REQUIRED);
    }

    if (date) {
      return (Activity as any).findByDateAndOwner(date, ownerId);
    }

    return Activity.find({ ownerId }).sort({ createdAt: -1 });
  }
}