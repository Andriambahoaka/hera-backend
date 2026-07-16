import {INotification } from "./notification.model";

export type CreateNotificationDto = {
  deviceId: string;
  msgType?: string;
  userId?:string;
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

