import { HTTP_STATUS } from "../../core/constants/httpStatus";

export const USER_ERRORS = {
  USER_NOT_FOUND: {
    status: HTTP_STATUS.NOT_FOUND,
    message: 'User not found',
  },
  OLD_PASSWORD_INCORRECT: {
    status: HTTP_STATUS.BAD_REQUEST,
    message: 'Current password is incorrect',
  },
};