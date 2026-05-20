import { IDevice } from "../device.model";

export function fromDevice(device: IDevice, userId: string) {
  return {
    userId,
    deviceId: device._id,
    hasAccess: true,
    access: [], 
  };
}