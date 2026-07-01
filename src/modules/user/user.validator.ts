import { AUTH_ERRORS } from "../auth/auth.errors";
import { USER_TYPE } from "./enums/userType.enum";
import { USER_ERRORS } from "./user.errors";
import { AppError } from "../../core/errors/app.error";
import { CreateUserDto } from "../user/dto/user.dto";

export async function validateMemberInput(
  data: CreateUserDto,
): Promise<void> {
  const { name, email, userType, ownerId } = data;

  if (!name || !email || !userType || !ownerId) {
    throw new AppError(AUTH_ERRORS.MISSING_MEMBER_FIELDS);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError(AUTH_ERRORS.INVALID_EMAIL_FORMAT);
  }

  const validUserTypes = [USER_TYPE.ADMIN, USER_TYPE.MEMBER];
  if (!validUserTypes.includes(userType)) {
    throw new AppError(AUTH_ERRORS.INVALID_USER_TYPE);
  }

  if (data.accessList === undefined || data.accessList.length === 0) {
    throw new AppError(USER_ERRORS.MEMBER_ACCESS_EMPTY);
  }
}