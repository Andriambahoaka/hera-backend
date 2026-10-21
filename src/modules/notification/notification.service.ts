
import admin from "../../core/config/firebase";
import Device from "../device/device.model";
import Notification, { IDevice, INotification } from "./notification.model";
import User, { IUser } from "../user/user.model";

import { AppError } from "../../core/errors/app.error";
import { Types } from 'mongoose';

import { getMessageBodyFromMsgType, getMessageTitleFromMsgType, getNotificationContent } from "./notification.util";
import { CreateNotificationDto, NotificationResponse } from "./notification.types";
import { DEVICE_ERRORS } from "../device/device.errors";
import { USER_ERRORS } from "../user/user.errors";
import { USER_TYPE } from "../user/enums/userType.enum";
import DeviceAccess from "../device/deviceAccess.model";
import { ACCESS_TYPE } from "../device/device.enum";

export class NotificationService {
  static async createAndSend(payload: CreateNotificationDto) {
    const { deviceId, userId, ...notificationData } = payload;

    const device = await this.getDevice(deviceId);

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

    const recipients = await this.getRecipients(
      device._id,
      device.ownerId,
      userId
    );

    const data = this.buildNotificationData(
      notification,
      device,
      recipients.triggeringUser
    );

    const title = getMessageTitleFromMsgType(
      notification.msgType ?? ""
    );

    const responses = [];

    if (recipients.otherTokens.length) {
      responses.push(
        await this.send({
          tokens: recipients.otherTokens,
          title,
          body: getMessageBodyFromMsgType(
            notification.msgType ?? "",
            device.deviceName,
            recipients.triggeringUser?.name
          ),
          data,
        })
      );
    }

    if (recipients.triggeringTokens.length) {
      responses.push(
        await this.send({
          tokens: recipients.triggeringTokens,
          title,
          body: getMessageBodyFromMsgType(
            notification.msgType ?? "",
            device.deviceName
          ),
          data,
        })
      );
    }

    return {
      message: "Notification created and sent",
      recipients: recipients.users.length,
      triggeringUser: recipients.triggeringUser,
      fcmResponse: responses,
    };
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private static async getDevice(deviceId: string) {
    const device = await Device.findOne({ deviceId }).select(
      "_id deviceName ownerId"
    );

    if (!device) {
      throw new AppError(DEVICE_ERRORS.DEVICE_NOT_FOUND);
    }

    return device;
  }

  private static async getRecipients(
    deviceObjectId: Types.ObjectId,
    ownerId: Types.ObjectId,
    triggeringUserId?: Types.ObjectId | string
  ) {
    const deviceAccesses = await DeviceAccess.find({
      device: deviceObjectId,
      access: ACCESS_TYPE.NOTIFICATION,
    }).select("userId");

    const uniqueUserIds = [
      ownerId.toString(),
      ...deviceAccesses.map((a) => a.userId.toString()),
    ];

    const users = await User.find({
      _id: {
        $in: [...new Set(uniqueUserIds)],
      },
    }).select("name devicesToken");

    const triggeringUser = users.find(
      (u) => u._id.toString() === triggeringUserId?.toString()
    );

    return {
      users,

      triggeringUser,

      triggeringTokens: triggeringUser?.devicesToken ?? [],

      otherTokens: users
        .filter((u) => u._id.toString() !== triggeringUserId?.toString())
        .flatMap((u) => u.devicesToken ?? []),
    };
  }

  private static buildNotificationData(
    notification: INotification,
    device: IDevice,
    triggeringUser?: IUser | null
  ) {
    return {
      id: notification._id.toString(),
      msgType: notification.msgType ?? "",
      deviceId: notification.deviceId ?? "",
      deviceName: device.deviceName,
      ownerId: device.ownerId.toString(),
      createdAt: notification.createdAt?.toISOString() ?? "",
      filePath: notification.filePath ?? "",

      ...(triggeringUser && {
        userId: triggeringUser._id.toString(),
        name: triggeringUser.name,
      }),
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

  static async findAllForUser(
    userId: string,
    page: number,
    limit: number
  ) {

    const deviceIds =
      await this.getAccessibleDeviceIds(userId);


    const filter =
      deviceIds === null
        ? {
          "device.ownerId": userId,
        }
        : {
          "device._id": {
            $in: deviceIds,
          },
        };


    const skip = (page - 1) * limit;


    const notifications = await Notification.find(filter)
      .populate<{ userId: IUser }>("userId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);


    const formattedNotifications = notifications.map(notification => ({
      ...notification.toObject(),

      user: notification.userId
        ? {
          id: notification.userId._id.toString(),
          name: notification.userId.name,
        }
        : null,

      userId: undefined,
    }));




    const total =
      await Notification.countDocuments(filter);


    const grouped = this.groupNotificationsByDate(
      formattedNotifications
    );


    return {
      notifications: grouped,

      pagination: {
        page,
        limit,
        total,
        hasMore:
          skip + notifications.length < total,
      },
    };
  }


  private static groupNotificationsByDate(
    notifications: NotificationResponse[]
  ) {

    const today: INotification[] = [];
    const yesterday: INotification[] = [];
    const last7Days: INotification[] = [];


    const now = new Date();

    const todayDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );


    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(
      todayDate.getDate() - 1
    );


    const last7DaysStart = new Date(todayDate);
    last7DaysStart.setDate(
      todayDate.getDate() - 7
    );


    for (const notification of notifications) {

      const createdAt =
        new Date(notification.createdAt!);


      const dateOnly = new Date(
        createdAt.getFullYear(),
        createdAt.getMonth(),
        createdAt.getDate()
      );


      if (
        dateOnly.getTime() === todayDate.getTime()
      ) {
        today.push(notification);

      } else if (
        dateOnly.getTime() === yesterdayDate.getTime()
      ) {
        yesterday.push(notification);

      } else if (
        dateOnly >= last7DaysStart &&
        dateOnly < yesterdayDate
      ) {
        last7Days.push(notification);
      }
    }


    return {
      today,
      yesterday,
      last7Days,
    };
  }


  private static async getAccessibleDeviceIds(userId: string) {
    const user = await User.findById(userId)
      .select("userType");

    if (!user) {
      throw new AppError(USER_ERRORS.USER_NOT_FOUND);
    }

    if (user.userType === USER_TYPE.OWNER) {
      return null;
    }


    const accesses = await DeviceAccess.find({
      userId,
      access: ACCESS_TYPE.NOTIFICATION,
    }).select("device");


    return accesses.map(
      (access) => access.device
    );
  }
}

