import { HTTP_STATUS } from "../../core/constants/httpStatus";

export const AUTH_ERRORS = {
  USER_EXISTS: {
    code: 'USER_EXISTS',
    status: HTTP_STATUS.CONFLICT,
    message: 'User already exists',
  },
  INVALID_CREDENTIALS: {
    code: 'INVALID_CREDENTIALS',
    status: HTTP_STATUS.UNAUTHORIZED,
    message: 'Invalid email or password',
  },
  EMAIL_REQUIRED: {
    code: 'EMAIL_REQUIRED',
    status: HTTP_STATUS.BAD_REQUEST,
    message: 'Email is required',
  },
  REFRESH_KEY_INVALID: {
    code: 'REFRESH_KEY_INVALID',
    status: HTTP_STATUS.BAD_REQUEST,
    message: 'Invalid refresh key',
  },
  REFRESH_KEY_MISSING: {
    code: 'REFRESH_KEY_MISSING',
    status: HTTP_STATUS.BAD_REQUEST,
    message: 'Refresh key is missing',
  },

  MISSING_MEMBER_FIELDS: {
    code: 'MISSING_MEMBER_FIELDS',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "The fields 'ownerId', 'name', 'email', and 'userType' are required.",
  },

  MISSING_OWNER_FIELDS: {
    code: 'MISSING_OWNER_FIELDS',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "The fields 'name' and 'email' are required.",
  },

  INVALID_EMAIL_FORMAT: {
    code: 'INVALID_EMAIL_FORMAT',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "The email address format is invalid.",
  },

  INVALID_USER_TYPE: {
    code: 'INVALID_USER_TYPE',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "The user type is invalid. Allowed values are: 2 (administrator) or 3 (member).",
  },

  OWNER_ID_NOT_ALLOWED: {
    code: 'OWNER_ID_NOT_ALLOWED',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "The field 'ownerId' must be null for owner-type users.",
  },

  INVALID_OWNER_ID: {
    code: 'INVALID_OWNER_ID',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "The owner identifier (ownerId) is invalid.",
  },

  OWNER_NOT_FOUND: {
    code: 'OWNER_NOT_FOUND',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "No owner user was found with this identifier.",
  },

  REFRESH_TOKEN_REQUIRED: {
    code: 'REFRESH_TOKEN_REQUIRED',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Refresh token is required.",
  },

  INVALID_REFRESH_TOKEN: {
    code: 'INVALID_REFRESH_TOKEN',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Invalid refresh token.",
  },

  REFRESH_KEY_EXPIRED: {
    code: 'REFRESH_KEY_EXPIRED',
    status: HTTP_STATUS.UNAUTHORIZED,
    message: "Refresh key has expired.",
  },

  INVALID_AUTH_HEADER: {
    code: 'INVALID_AUTH_HEADER',
    status: HTTP_STATUS.UNAUTHORIZED,
    message: "Missing or malformed authorization header.",
  },

  UNAUTHORIZED: {
    code: 'UNAUTHORIZED',
    status: HTTP_STATUS.UNAUTHORIZED,
    message: 'Invalid or expired authorization token.',
  },

  CLIENT_AUTH_FAILED: {
    code: "CLIENT_AUTH_FAILED",
    status: HTTP_STATUS.UNAUTHORIZED,
    message: "Invalid client credentials.",
  },

  INVALID_API_KEY: {
    code: 'INVALID_API_KEY',
    status: HTTP_STATUS.UNAUTHORIZED,
    message: 'Invalid API key',
  },
  API_KEY_EXPIRED: {
    code: 'API_KEY_EXPIRED',
    status: HTTP_STATUS.UNAUTHORIZED,
    message: 'API key has expired',
  },
  MISSING_CREDENTIALS: {
    code: 'MISSING_CREDENTIALS',
    status: HTTP_STATUS.BAD_REQUEST,
    message: 'Missing client credentials (clientId and clientSecret)',
  },
};