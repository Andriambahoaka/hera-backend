import { HTTP_STATUS } from "../../core/constants/httpStatus";

export const DEVICE_ERRORS = {
  // add device
  MISSING_REQUIRED_FIELDS: {
    code: "MISSING_REQUIRED_FIELDS",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Les champs requis sont manquants.",
  },

  INVALID_OWNER_ID: {
    code: "INVALID_OWNER_ID",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "ID du propriétaire invalide",
  },

  OWNER_NOT_FOUND: {
    code: "OWNER_NOT_FOUND",
    status: HTTP_STATUS.NOT_FOUND,
    message: "Le propriétaire spécifié n'existe pas",
  },

  INVALID_OWNER_TYPE: {
    code: "INVALID_OWNER_TYPE",
    status: HTTP_STATUS.FORBIDDEN,
    message: "Seuls les utilisateurs de type propriétaire peuvent posséder un pack",
  },

  DEVICE_ALREADY_EXISTS: {
    code: "DEVICE_ALREADY_EXISTS",
    status: HTTP_STATUS.CONFLICT,
    message: "Le dispositif existe déjà",
  },

  NAME_ALREADY_EXISTS: {
    code: "NAME_ALREADY_EXISTS",
    status: HTTP_STATUS.CONFLICT,
    message: "Le nom du dispositif existe déjà",
  },

  DEVICE_NOT_EXIST: {
    code: "DEVICE_NOT_EXIST",
    status: HTTP_STATUS.NOT_FOUND,
    message: "Le dispositif n'existe pas",
  },

  DEVICE_OFFLINE: {
    code: "DEVICE_OFFLINE",
    status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    message: "Le dispositif est hors ligne",
  },

  INVALID_CREDENTIALS: {
    code: "INVALID_CREDENTIALS",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Identifiants du dispositif invalides",
  },

  MODEL_NOT_SUPPORTED: {
    code: "MODEL_NOT_SUPPORTED",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Le modèle de dispositif n'est pas pris en charge ou la catégorie est incorrecte",
  },

  INVALID_DEVICE_PRODUCT: {
    code: "INVALID_DEVICE_PRODUCT",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Le dispositif n'appartient pas à ce produit",
  },

  DEVICE_ADD_FAILED: {
    code: "DEVICE_ADD_FAILED",
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: "Échec de l'ajout du dispositif",
  },

  // add accessory
  MISSING_ACCESSORY_FIELDS: {
    code: "MISSING_ACCESSORY_FIELDS",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "deviceId et accessoryInfo sont requis",
  },

  MISSING_DEVICE_ID_FIELD: {
    code: "MISSING_DEVICE_ID_FIELD",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "deviceId est requis",
  },

  DEVICE_NOT_FOUND: {
    code: "DEVICE_NOT_FOUND",
    status: HTTP_STATUS.NOT_FOUND,
    message: "Dispositif introuvable",
  },


  INVALID_DEVICE_ACCESS_PAYLOAD: {
    code: "INVALID_DEVICE_ACCESS_PAYLOAD",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Invalid device access payload",
  },

  MISSING_ARMING_REQUIRED_FIELDS: {
    code: "MISSING_ARMING_REQUIRED_FIELDS",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "deviceId and isArmed are required",
  },

  MISSING_PIRCAM_REQUIRED_FIELDS: {
    code: "MISSING_PIRCAM_REQUIRED_FIELDS",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "deviceId, accessoryId, and channel are required",
  },
  MISSING_SET_ACCESSORY_REQUIRED_FIELDS: {
    code: "MISSING_SET_ACCESSORY_REQUIRED_FIELDS",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "deviceId, accessoryId and type are required",
  },

  DEVICE_SET_AREA_ARM_FAILED: {
    code: "DEVICE_SET_AREA_ARM_FAILED",
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: "Failed to set area arm mode for device",
  },
  DEVICE_GET_AREA_ARM_FAILED: {
    code: "DEVICE_GET_AREA_ARM_FAILED",
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: "Failed to get area arm mode for device",
  },

  ACCESSORY_ADD_FAILED: {
    code: "ACCESSORY_ADD_FAILED",
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: "Failed to add accessory",
  },
  DOLYNK_AUTH_FAILED: {
    code: "DOLYNK_AUTH_FAILED",
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: "Failed to authenticate with Dolynk service",
  },
  DEVICE_GET_ACCESSORIES_INFO_FAILED: {
    code: "DEVICE_GET_ACCESSORIES_INFO_FAILED",
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: "Failed to get accessories info for device",
  },
  DEVICE_GET_PIR_CAM_SNAP_URL_FAILED: {
    code: "DEVICE_GET_PIR_CAM_SNAP_URL_FAILED",
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: "Failed to get PIR camera snapshot URL for device",
  }
  ,
  MISSING_ACCESSORY_ID_FIELD: {
    code: "MISSING_ACCESSORY_ID_FIELD",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "accessoryId field is required",
  },
  ACCESSORY_NOT_SUPPORTED: {
    code: "ACCESSORY_NOT_SUPPORTED",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "The accessory type is not supported'",
  },

  INVALID_ACCESS_LIST: {
    code: "INVALID_ACCESS_LIST",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Access list must be an array",
  },
  MISSING_ACCESS_FIELDS: {
    code: "MISSING_ACCESS_FIELDS",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Each access item must contain deviceAccessId, hasAccess, and access fields",
  },
  INVALID_DEVICE_ID: {
    code: "INVALID_DEVICE_ID",
    status: HTTP_STATUS.BAD_REQUEST,
    message: "Invalid device ID",
  },
};