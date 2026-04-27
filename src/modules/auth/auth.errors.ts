import { HTTP_STATUS } from "../../core/constants/httpStatus";

export const AUTH_ERRORS = {
  USER_EXISTS: {
    status: HTTP_STATUS.CONFLICT,
    message: 'User already exists',
  },
  INVALID_CREDENTIALS: {
    status: HTTP_STATUS.UNAUTHORIZED,
    message: 'Invalid email or password',
  },
};