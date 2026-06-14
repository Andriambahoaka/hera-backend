import { IDevice } from "../device.model";

export function fromDevice(device: IDevice, userId: string) {
  return {
    userId,
    device: device,
    hasAccess: true,
    access: [], 
  };
}