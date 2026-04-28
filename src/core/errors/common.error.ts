import { HTTP_STATUS } from "../constants/httpStatus";

export const COMMON_ERRORS = {
  INTERNAL_SERVER_ERROR: {
    code: 'INTERNAL_SERVER_ERROR',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred. Please try again later.',
  },
  BAD_REQUEST: {
    code: 'BAD_REQUEST',
    status: HTTP_STATUS.BAD_REQUEST,
    message: 'Bad request. Please check your input and try again.',
  },
  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    status: HTTP_STATUS.UNAUTHORIZED,
    message: 'Unauthorized. Please provide valid credentials.',
  },
  FORBIDDEN: {
    code: 'FORBIDDEN',
    status: HTTP_STATUS.FORBIDDEN,
    message: 'Forbidden. You do not have permission to access this resource.',
  },
  NOT_FOUND: {
    code: 'NOT_FOUND',
    status: HTTP_STATUS.NOT_FOUND,
    message: 'Resource not found.',
  },
};