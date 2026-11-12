import "express";
import type { IDevice } from "../../modules/device/device.model";
import type { AccessLevel } from "../../modules/device/deviceAccess.model";

declare module "express" {
  export interface Request {
    auth?: {
      userId: string;
    };
    /** Raw JSON text, kept only for the Dolynk webhook (see app.ts). */
    rawBody?: string;
    /** Set by requireDeviceAccess(). */
    deviceAccess?: {
      device: IDevice;
      level: AccessLevel;
    };
  }
}
