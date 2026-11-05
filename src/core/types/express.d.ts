import "express";
import type { IDevice } from "../../modules/device/device.model";
import type { AccessLevel } from "../../modules/device/deviceAccess.model";

declare module "express" {
  export interface Request {
    auth?: {
      userId: string;
    };
    /** Set by requireDeviceAccess(). */
    deviceAccess?: {
      device: IDevice;
      level: AccessLevel;
    };
  }
}
