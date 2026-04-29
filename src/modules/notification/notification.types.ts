export type CreateNotificationDto = {
  deviceId: string;
  userName?: string;
  msgType?: string;
  [key: string]: any;
};
