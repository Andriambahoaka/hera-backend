import { HTTP_STATUS } from "../../core/constants/httpStatus";

export const USER_ERRORS = {
  USER_NOT_FOUND: {
    code: 'USER_NOT_FOUND',
    status: HTTP_STATUS.NOT_FOUND,
    message: 'User not found',
  },
  OLD_PASSWORD_INCORRECT: {
    code: 'OLD_PASSWORD_INCORRECT',
    status: HTTP_STATUS.BAD_REQUEST,
    message: 'Current password is incorrect',
  },
  OLD_NEW_PASSWORD_REQUIRED: {
    code: 'OLD_NEW_PASSWORD_REQUIRED',
    status: HTTP_STATUS.BAD_REQUEST,
    message: 'Old and new passwords are required',
  },
};