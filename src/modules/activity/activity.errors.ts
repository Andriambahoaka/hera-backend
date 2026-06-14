import { HTTP_STATUS } from "../../core/constants/httpStatus";

export const ACTIVITY_ERRORS = {
  CONTENT_REQUIRED: {
    code: "CONTENT_REQUIRED",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Activity content is required",
  },

  OWNER_ID_REQUIRED: {
    code: "OWNER_ID_REQUIRED",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Owner ID is required",
  },
};