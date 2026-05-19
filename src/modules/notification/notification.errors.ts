import { HTTP_STATUS } from "../../core/constants/httpStatus";

export const NOTIFICATION_ERRORS = {
  USER_OR_TOKEN_NOT_FOUND: {
    code: "USER_OR_TOKEN_NOT_FOUND",
    status: HTTP_STATUS.NOT_FOUND,
    message: "User or device tokens not found",
  },

  OWNER_ID_REQUIRED: {
    code: "OWNER_ID_REQUIRED",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Owner ID is required",
  },
};