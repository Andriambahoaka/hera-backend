import admin from '../core/config/firebase';
import Notification from '../models/notification.model';
import Pack from '../models/pack.model';
import User from '../modules/user/user.model';
import {
  getMessageTitleFromMsgType,
  getMessageBodyFromMsgType,
} from '../core/utils/notificationMessage.util';

export class NotificationService {
  static async createAndSendNotification(payload: any) {
    const { deviceId, userName, id, ...notificationData } = payload;

    const pack = await Pack.findOne({ deviceId }).select('_id deviceName ownerId');
    if (!pack) {
      throw new Error('PACK_NOT_FOUND');
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
      throw new Error('USER_OR_TOKEN_NOT_FOUND');
    }

    const title = getMessageTitleFromMsgType(notification.msgType ?? '');
    const body = getMessageBodyFromMsgType(
      notification.msgType ?? '',
      pack.deviceName,
      userName
    );

    const message = {
      notification: { title, body },
      data: {
        id: notification._id.toString(),
        msgType: notification.msgType ?? '',
        deviceId: notification.deviceId ?? '',
        deviceName: pack.deviceName,
        ownerId: pack.ownerId.toString(),
        createdAt: notification.createdAt!.toISOString(),
      },
      tokens: user.devicesToken,
    };

    const fcmResponse = await admin.messaging().sendEachForMulticast(message);

    return { notification, fcmResponse };
  }

  static async findAllByOwner(ownerId: string) {
    const notifications = await Notification.find({ 'pack.ownerId': ownerId });

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
