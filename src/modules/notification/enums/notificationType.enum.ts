export enum NotificationType {
  ALARM_LOCAL = "AlarmLocal",
  ARMED = "armed",
  DISARMED = "disarmed",
  ONLINE = "online",
  OFFLINE = "offline",
  SENSOR_ABNORMAL = "SensorAbnormal",
  PHOTO_CAPTURED = "photoCaptured",
  /** Data-only: the recipient's access to a device changed. Not stored. */
  ACCESS_CHANGED = "accessChanged",
}