import { AppError } from "../../core/errors/app.error";
import { AUTH_ERRORS } from "./auth.errors";
import { CreateUserDto } from "../user/dto/user.dto";


export async function validateSignupInput(
  data: CreateUserDto,
): Promise<void> {
  const { name, email} = data;

  if (!name || !email) {
    throw new AppError(AUTH_ERRORS.MISSING_OWNER_FIELDS);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError(AUTH_ERRORS.INVALID_EMAIL_FORMAT);
  }
}
