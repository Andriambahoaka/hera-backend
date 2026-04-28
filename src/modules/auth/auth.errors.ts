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

  MISSING_REQUIRED_FIELDS: {
    code: 'MISSING_REQUIRED_FIELDS',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Les champs 'name', 'email' et 'userType' sont obligatoires.",
  },
  INVALID_EMAIL_FORMAT: {
    code: 'INVALID_EMAIL_FORMAT',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Le format de l'adresse e-mail est invalide.",
  },

  INVALID_USER_TYPE: {
    code: 'INVALID_USER_TYPE',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Le type d'utilisateur est invalide. Les valeurs possibles sont : 1 (propriétaire), 2 (administrateur) ou 3 (membre).",
  },

  OWNER_ID_REQUIRED: {
    code: 'OWNER_ID_REQUIRED',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Le champ 'ownerId' est obligatoire pour les utilisateurs de type administrateur ou membre.",
  },

  OWNER_ID_NOT_ALLOWED: {
    code: 'OWNER_ID_NOT_ALLOWED',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Le champ 'ownerId' doit être nul pour les utilisateurs de type propriétaire.",
  },

  INVALID_OWNER_ID: {
    code: 'INVALID_OWNER_ID',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "L'identifiant du propriétaire (ownerId) est invalide.",
  },

  OWNER_NOT_FOUND: {
    code: 'OWNER_NOT_FOUND',
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Aucun utilisateur propriétaire n’a été trouvé avec cet identifiant",
  },
  REFRESH_TOKEN_REQUIRED: {
    code: 'REFRESH_TOKEN_REQUIRED',
    status: HTTP_STATUS.BAD_REQUEST,
    message: 'Refresh token is required',
  },
  INVALID_REFRESH_TOKEN: {
    code: 'INVALID_REFRESH_TOKEN',
    status: HTTP_STATUS.BAD_REQUEST,
    message: 'Invalid refresh token',
  },
  REFRESH_KEY_EXPIRED: {
    code: 'REFRESH_KEY_EXPIRED',
    status: HTTP_STATUS.UNAUTHORIZED,
    message: 'Refresh key has expired',
  },

  INVALID_AUTH_HEADER: {
    code: 'INVALID_AUTH_HEADER',
    status: HTTP_STATUS.UNAUTHORIZED,
    message: 'Missing or malformed authorization header',
  },

};