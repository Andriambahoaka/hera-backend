import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import User from "../../src/modules/user/user.model";
import Device from "../../src/modules/device/device.model";
import DeviceAccess, { AccessLevel } from "../../src/modules/device/deviceAccess.model";
import { USER_TYPE } from "../../src/modules/user/enums/userType.enum";

let counter = 0;

export const DEFAULT_PASSWORD = "Password123!";

/** Creates a user directly in the DB. Low bcrypt cost to keep tests fast. */
export async function createUser(
  overrides: Partial<{
    name: string;
    email: string;
    password: string;
    userType: USER_TYPE;
    ownerId: string | null;
    devicesToken: string[];
  }> = {}
) {
  counter += 1;
  const password = overrides.password ?? DEFAULT_PASSWORD;

  return User.create({
    name: overrides.name ?? `User ${counter}`,
    email: overrides.email ?? `user${counter}@test.local`,
    password: await bcrypt.hash(password, 4),
    userType: overrides.userType ?? USER_TYPE.OWNER,
    ownerId: overrides.ownerId ?? null,
    devicesToken: overrides.devicesToken ?? [],
  });
}

/** Creates a member (or admin) attached to an owner's household. */
export function createMember(
  owner: { _id: Types.ObjectId },
  userType: USER_TYPE.MEMBER | USER_TYPE.ADMIN = USER_TYPE.MEMBER,
  overrides: Parameters<typeof createUser>[0] = {}
) {
  return createUser({ ...overrides, userType, ownerId: owner._id.toString() });
}

/** Creates a device in the DB (no Dolynk call). */
export async function createDevice(
  owner: { _id: Types.ObjectId },
  overrides: Partial<{ deviceId: string; deviceName: string; devCode: string }> = {}
) {
  counter += 1;
  return Device.create({
    ownerId: owner._id,
    deviceId: overrides.deviceId ?? `DEV${counter}`,
    deviceName: overrides.deviceName ?? `Device ${counter}`,
    devCode: overrides.devCode ?? "Dolynk_c2VjcmV0LWRldi1jb2Rl",
  });
}

export function grantAccess(
  user: { _id: Types.ObjectId },
  device: { _id: Types.ObjectId },
  accessLevel: AccessLevel
) {
  return DeviceAccess.create({ userId: user._id, device: device._id, accessLevel });
}

/** Signs an access token the same way the app currently does. */
export function accessTokenFor(userId: { toString(): string }) {
  return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });
}

/** Authorization header value for a user. */
export const bearer = (user: { _id: { toString(): string } }) => `Bearer ${accessTokenFor(user._id)}`;
