
import admin from "../../core/config/firebase";
import Device from "../device/device.model";
import Notification from "./notification.model";
import User from "../user/user.model";

import { AppError } from "../../core/errors/app.error";
import { NOTIFICATION_ERRORS } from "./notification.errors";

import { getNotificationContent } from "./notification.util";
import { CreateNotificationDto } from "./notification.types";
import { DEVICE_ERRORS } from "../device/device.errors";
import { USER_ERRORS } from "../user/user.errors";
import { USER_TYPE } from "../user/enums/userType.enum";

export class NotificationService {
  static async createAndSend(payload: CreateNotificationDto) {
    const { deviceId, userId, ...notificationData } = payload;


    const device = await Device.findOne({ deviceId }).select("_id deviceName ownerId");
    if (!device) {
      throw new AppError(DEVICE_ERRORS.DEVICE_NOT_FOUND);
    }

    const notification = await Notification.create({
      ...notificationData,
      deviceId,
      userId,
      device: {
        _id: device._id,
        deviceName: device.deviceName,
        ownerId: device.ownerId,
      },
    });

    const [owner, triggeringUser] = await Promise.all([
      User.findById(device.ownerId),
      userId ? User.findById(userId).select("name") : null,
    ]);

    if (!owner?.devicesToken?.length) {
      throw new AppError(NOTIFICATION_ERRORS.USER_OR_TOKEN_NOT_FOUND);
    }

    const userName = triggeringUser?.name;

    const { title, body } = getNotificationContent(notification.msgType ?? "", device.deviceName, userName);

    const fcmResponse = await NotificationService.send({
      tokens: owner.devicesToken,
      title,
      body,
      data: {
        id: notification._id.toString(),
        msgType: notification.msgType ?? "",
        deviceId: notification.deviceId ?? "",
        deviceName: device.deviceName,
        ownerId: device.ownerId.toString(),
        createdAt: notification.createdAt?.toISOString() ?? "",
        ...(userId && {
          userId,
          name: userName ?? "",
        }),
      },
    });


    return {
      message: "Notification created and sent",
      fcmResponse,
    };
  }

  static async send(params: {
    tokens: string[];
    title: string;
    body: string;
    data?: Record<string, string>;
  }) {
    const {
      tokens,
      title,
      body,
      data,
    } = params;

    return admin.messaging().sendEachForMulticast({
      notification: {
        title,
        body,
      },
      data,
      tokens,
    });
  }

  static async findAllByOwner(userId: string,page: number,limit:number) {

    const user = await User.findById(userId)
      .select("ownerId userType")
      .lean();

    if (!user) {
      throw new AppError(USER_ERRORS.USER_NOT_FOUND);
    }

    const ownerId =
      user.userType != USER_TYPE.OWNER
        ? user.ownerId
        : userId;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({
      "device.ownerId": ownerId
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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

    const total = await Notification.countDocuments({
      "device.ownerId": ownerId,
    });

    return {
      notifications: {
        today, yesterday, last7Days
      },
      pagination: {
        page,
        limit,
        total,
        hasMore: skip + notifications.length < total,
      },
    };

  }
}
