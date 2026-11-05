import mongoose from "mongoose";
import User from "./user.model";
import { USER_TYPE } from "./enums/userType.enum";
import { AppError } from "../../core/errors/app.error";
import { USER_ERRORS } from "./user.errors";
import { AUTH_ERRORS } from "../auth/auth.errors";

/** The household id of a user: the owner's own id, or the ownerId of a member/admin. */
export function householdIdOf(user: { _id: unknown; userType: number; ownerId?: string | null }) {
  return user.userType === USER_TYPE.OWNER ? String(user._id) : user.ownerId ?? null;
}

/**
 * Allows a user to act on another user only if it is themselves, or if they are
 * an OWNER/ADMIN of the same household.
 */
export async function assertCanManageUser(requesterId: string, targetId: unknown) {
  if (typeof targetId !== "string" || !mongoose.Types.ObjectId.isValid(targetId)) {
    throw new AppError(USER_ERRORS.INVALID_USER_ID);
  }
  if (requesterId === targetId) return;

  const [requester, target] = await Promise.all([
    User.findById(requesterId).select("userType ownerId").lean(),
    User.findById(targetId).select("userType ownerId").lean(),
  ]);

  if (!requester) throw new AppError(AUTH_ERRORS.UNAUTHORIZED);
  if (!target) throw new AppError(USER_ERRORS.USER_NOT_FOUND);

  const isManager =
    requester.userType === USER_TYPE.OWNER || requester.userType === USER_TYPE.ADMIN;
  const household = householdIdOf(requester);

  if (!isManager || !household || householdIdOf(target) !== household) {
    throw new AppError(USER_ERRORS.NOT_SAME_HOUSEHOLD);
  }
}
