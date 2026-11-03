import { AccessLevel } from './deviceAccess.model';
import type { IDevice } from './device.model';


export type AccessRequest = {
    deviceId: string; 
    accessLevel: AccessLevel;
};

export type AccessoryRequest = {
    deviceId: string;
    accessoriesId: string[];
};

export type DeviceWithAccess = {
    device: IDevice;
    accessLevel: AccessLevel
};