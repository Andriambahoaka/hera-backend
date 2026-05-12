import { HTTP_STATUS } from "../../core/constants/httpStatus";

export const PACK_ERRORS = {
  INVALID_OWNER_ID: {
    code: "INVALID_OWNER_ID",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Invalid owner ID",
  },

  OWNER_NOT_FOUND: {
    code: "OWNER_NOT_FOUND",
    status: HTTP_STATUS.NOT_FOUND,
    message: "Owner not found",
  },

  INVALID_OWNER_TYPE: {
    code: "INVALID_OWNER_TYPE",
    status: HTTP_STATUS.FORBIDDEN,
    message: "User is not allowed to own a pack",
  },

  DEVICE_ALREADY_EXISTS: {
    code: "DEVICE_ALREADY_EXISTS",
    status: HTTP_STATUS.CONFLICT,
    message: "Device already exists",
  },

  PACK_NOT_FOUND: {
    code: "PACK_NOT_FOUND",
    status: HTTP_STATUS.NOT_FOUND,
    message: "Pack not found",
  },

  INVALID_PACK_ACCESS_PAYLOAD: {
    code: "INVALID_PACK_ACCESS_PAYLOAD",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Invalid pack access payload",
  },
  MISSING_REQUIRED_FIELDS: {
    code: "MISSING_REQUIRED_FIELDS",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "ownerId, deviceId, deviceName and devCode are required",

  },

  DEVICE_PASSWORD_INCORRECT: {
    code: "DEVICE_PASSWORD_INCORRECT",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Device password is incorrect",
  },

  DEVICE_OFFLINE: {
    code: "DEVICE_OFFLINE",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Device is offline",
  },

  INVALID_DEVICE_PRODUCT: {
    code: "INVALID_DEVICE_PRODUCT",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Device does not belong to this product",
  },
  DEVICE_NOT_EXIST: {
    code: "DEVICE_NOT_EXIST",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Device does not exist",
  },
  DEVICE_ADD_FAILED: {
    code: "DEVICE_ADD_FAILED",
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: "Failed to add device",
  },
  DOLYNK_AUTH_FAILED: {
  code: "DOLYNK_AUTH_FAILED",
  status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message: "Failed to authenticate with Dolynk service",
},
};