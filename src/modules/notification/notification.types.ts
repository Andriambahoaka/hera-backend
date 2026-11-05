import {INotification } from "./notification.model";

export type CreateNotificationDto = {
  deviceId: string;
  msgType?: string;
  /** Set only by internal callers (the user who triggered the action). */
  userId?: string;
  category?: string;
  channelId?: number;
  utcTime?: number;
  localTime?: number;
  filePath?: string;
  alarmType?: string;
  accessKey?: string;
  productId?: string;
};

export type NotificationResponse = Omit<
  INotification,
  "userId"
> & {
  user: {
    id: string;
    name: string;
  } | null;
};

