

import admin from "firebase-admin";
import Device from "../device/device.model";
import Notification from "./notification.model";
import User from "../user/user.model";

import { AppError } from "../../core/errors/app.error";
import { NOTIFICATION_ERRORS } from "./notification.errors";

import { getNotificationContent} from "./notification.util";
import { CreateNotificationDto} from "./notification.types";
import { DEVICE_ERRORS } from "../device/device.errors";

export class NotificationService {

  static async createAndSendNotification(payload: CreateNotificationDto) {
    const { deviceId, userName, ...notificationData } = payload;

    const device = await Device.findOne({ deviceId }).select("_id deviceName ownerId");
    if (!device) {
      throw new AppError(DEVICE_ERRORS.DEVICE_NOT_FOUND);
    }

    const notification = await Notification.create({
      ...notificationData,
      deviceId,
      pack: {
        _id: device._id,
        deviceName: device.deviceName,
        ownerId: device.ownerId,
      },
    });

    const user = await User.findById(device.ownerId);
    if (!user || !user.devicesToken || user.devicesToken.length === 0) {
      throw new AppError(NOTIFICATION_ERRORS.USER_OR_TOKEN_NOT_FOUND);
    }
    
   const { title, body } = getNotificationContent(notification.msgType ?? "", device.deviceName, userName);

    const message = {
      notification: { title, body },
      data: {
        id: notification._id.toString(),
        msgType: notification.msgType ?? "",
        deviceId: notification.deviceId ?? "",
        deviceName: device.deviceName,
        ownerId: device.ownerId.toString(),
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
