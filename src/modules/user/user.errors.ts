import { HTTP_STATUS } from "../../core/constants/httpStatus";

export const USER_ERRORS = {
  USER_NOT_FOUND: {
    code: "USER_NOT_FOUND",
    status: HTTP_STATUS.NOT_FOUND,
    message: "User not found",
  },

  OLD_NEW_PASSWORD_REQUIRED: {
    code: "OLD_NEW_PASSWORD_REQUIRED",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Old password and new password are required",
  },

  OLD_PASSWORD_INCORRECT: {
    code: "OLD_PASSWORD_INCORRECT",
    status: HTTP_STATUS.UNAUTHORIZED,
    message: "Old password is incorrect",
  },

  DEVICE_TOKEN_REQUIRED: {
    code: "DEVICE_TOKEN_REQUIRED",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Device token required",
  },

  DEVICE_TOKEN_NOT_FOUND: {
    code: "DEVICE_TOKEN_NOT_FOUND",
    status: HTTP_STATUS.NOT_FOUND,
    message: "Device token not found for this user",
  },

  USER_TYPE_REQUIRED: {
    code: "USER_TYPE_REQUIRED",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "User type and type_id are required",
  },

  OWNER_ID_REQUIRED: {
    code: "OWNER_ID_REQUIRED",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Owner ID is required",
  },

  USER_ID_REQUIRED: {
    code: "USER_ID_REQUIRED",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "User ID is required",
  },
  INVALID_USER_ID: {
    code: "INVALID_USER_ID",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Invalid user ID format",
  },

  NO_IMAGE_PROVIDED: {
    code: "NO_IMAGE_PROVIDED",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "No image file provided."
  },

  RESET_PASSWORD_TOKEN_MISSING: {
    code: "RESET_PASSWORD_TOKEN_MISSING",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Reset password token is missing",
  },

  EMAIL_REQUIRED: {
    code: "EMAIL_REQUIRED",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Email is required",
  },
  RESET_PASSWORD_TOKEN_EXPIRED: {
    code: "RESET_PASSWORD_TOKEN_EXPIRED",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Reset password token has expired",
  },

  RESET_PASSWORD_TOKEN_INVALID: {
    code: "RESET_PASSWORD_TOKEN_INVALID",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Reset password token is invalid",
  },
};