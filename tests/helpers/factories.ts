import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../../src/modules/user/user.model";
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
  });
}

/** Signs an access token the same way the app currently does. */
export function accessTokenFor(userId: { toString(): string }) {
  return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET!, {
    expiresIn: "1h",
  });
}
