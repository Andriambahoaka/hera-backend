

import admin from "firebase-admin";
import Pack from "../pack/pack.model";
import Notification from "./notification.model";
import User from "../user/user.model";

import { AppError } from "../../core/errors/AppError";
import { NOTIFICATION_ERRORS } from "./notification.errors";

import { getNotificationContent} from "./notification.util";
import { CreateNotificationDto} from "./notification.types";

export class NotificationService {

  static async createAndSendNotification(payload: CreateNotificationDto) {
    const { deviceId, userName, ...notificationData } = payload;

    const pack = await Pack.findOne({ deviceId }).select("_id deviceName ownerId");
    if (!pack) {
      throw new AppError(NOTIFICATION_ERRORS.PACK_NOT_FOUND);
    }

    const notification = await Notification.create({
      ...notificationData,
      deviceId,
      pack: {
        _id: pack._id,
        deviceName: pack.deviceName,
        ownerId: pack.ownerId,
      },
    });

    const user = await User.findById(pack.ownerId);
    if (!user || !user.devicesToken || user.devicesToken.length === 0) {
      throw new AppError(NOTIFICATION_ERRORS.USER_OR_TOKEN_NOT_FOUND);
    }
    
   const { title, body } = getNotificationContent(notification.msgType ?? "", pack.deviceName, userName);

    const message = {
      notification: { title, body },
      data: {
        id: notification._id.toString(),
        msgType: notification.msgType ?? "",
        deviceId: notification.deviceId ?? "",
        deviceName: pack.deviceName,
        ownerId: pack.ownerId.toString(),
        createdAt: notification.createdAt!.toISOString(),
      },
      tokens: user.devicesToken,
    };

    const fcmResponse = await admin.messaging().sendEachForMulticast(message);

    return {
      message: "Notification created and sent",
      notification,
      fcmResponse,
    };
  }

  static async findAllByOwner(ownerId: string) {
    if (!ownerId) {
      throw new AppError(NOTIFICATION_ERRORS.OWNER_ID_REQUIRED);
    }

    const notifications = await Notification.find({ "pack.ownerId": ownerId });

    const today: any[] = [];
    const yesterday: any[] = [];
    const last7Days: any[] = [];

    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(todayDate.getDate() - 1);

    const last7DaysStart = new Date(todayDate);
    last7DaysStart.setDate(todayDate.getDate() - 7);

    for (const notification of notifications) {
      const createdAt = new Date(notification.createdAt!);

      const dateOnly = new Date(
        createdAt.getFullYear(),
        createdAt.getMonth(),
        createdAt.getDate()
      );

      if (dateOnly.getTime() === todayDate.getTime()) {
        today.push(notification);
      } else if (dateOnly.getTime() === yesterdayDate.getTime()) {
        yesterday.push(notification);
      } else if (dateOnly >= last7DaysStart && dateOnly < yesterdayDate) {
        last7Days.push(notification);
      }
    }

    return { today, yesterday, last7Days };
  }
}
