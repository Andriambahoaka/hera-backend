import { IDeviceAccess } from "../../device/deviceAccess.model";
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string | null;
  userType: number;
  ownerId?: string | null;
  ownerName?: string | null;
  accessList: IDeviceAccess[];
}