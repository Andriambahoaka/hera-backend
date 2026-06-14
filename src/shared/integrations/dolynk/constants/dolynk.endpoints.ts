

export const DEVICE_SEGMENT = "api-iot/device";
export const ALARM_SEGMENT = `${DEVICE_SEGMENT}/alarm`;

export const ACCESSORY_ENDPOINTS = {
    PIRCam: "api-aiot/alarm/outDoorPirCamera/setAccessoryInfo",
    UrgencyButton: `/${ALARM_SEGMENT}/panicButton/setAccessoryInfo`,
    AlarmBell: `/${ALARM_SEGMENT}/indoorAlarmBell/setAccessoryInfo`,
} as const;

