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
};