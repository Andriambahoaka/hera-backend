import { SignupDto } from "./dto/signup.dto";
import { AppError } from "../../core/errors/app.error";
import { AUTH_ERRORS } from "./auth.errors";
import { USER_TYPE } from "../user/enums/userType.enum";
import { CreateUserDto } from "../user/dto/user.dto";
import { USER_ERRORS } from "../user/user.errors";


export async function validateSignupInput(
  data: CreateUserDto,
  isMemberSignup: boolean = false
): Promise<void> {
  const { name, email, userType, ownerId } = data;

  if (!name || !email || !userType) {
    throw new AppError(AUTH_ERRORS.MISSING_REQUIRED_FIELDS);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError(AUTH_ERRORS.INVALID_EMAIL_FORMAT);
  }

  const validUserTypes = [USER_TYPE.OWNER, USER_TYPE.ADMIN, USER_TYPE.MEMBER];
  if (!validUserTypes.includes(userType)) {
    throw new AppError(AUTH_ERRORS.INVALID_USER_TYPE);
  }

  if ((userType === USER_TYPE.ADMIN || userType === USER_TYPE.MEMBER) && !ownerId) {
    throw new AppError(AUTH_ERRORS.OWNER_ID_REQUIRED);
  }

  if (userType === USER_TYPE.OWNER && ownerId) {
    throw new AppError(AUTH_ERRORS.OWNER_ID_NOT_ALLOWED);
  }

  if (isMemberSignup && data.accessList.length === 0) {
    throw new AppError(USER_ERRORS.MEMBER_ACCESS_EMPTY);
  }
}
