export const ERRORS = {
  // Auth & Tokens
  TOKEN_MISSING: "Token manquant ou mal formé.",
  TOKEN_INVALID: "Token invalide ou expiré.",
  OLD_PASSWORD_INCORRECT: "Ancien mot de passe incorrect.",
  EMAIL_REQUIRED: "Email requis.",
  PASSWORD_REQUIRED: "Mot de passe requis.",
  EMAIL_PASSWORD_REQUIRED: "Email et mot de passe requis.",
  OLD_NEW_PASSWORD_REQUIRED: "Ancien et nouveau mot de passe requis.",
  CREDENTIALS_INCORRECT: "Paire identifiant/mot de passe incorrect",

  // User
  USER_NOT_FOUND: "Utilisateur introuvable.",
  USER_EXISTS: "Un utilisateur avec cet email existe déjà.",
  USER_TYPE_REQUIRED: "type_id et name sont requis.",
  USER_ID_REQUIRED: "userId requis.",

  // Pack
  OWNER_NOT_FOUND: "Propriétaire non trouvé.",
  INVALID_OWNER_ID: "Identifiant du propriétaire invalide.",
  INVALID_OWNER_TYPE: "Le propriétaire doit être de type 0 ou 1.",
  DEVICE_ALREADY_EXISTS: "Un pack avec ce deviceId existe déjà.",

  // Device Token
  DEVICE_TOKEN_REQUIRED: "userId et deviceToken sont requis.",
  DEVICE_TOKEN_NOT_FOUND: "Token non trouvé dans la liste.",

  // Generic
  UNKNOWN_ERROR: "Une erreur interne est survenue.",
  INVALID_CREDENTIALS: "Identifiants invalides.",
  REFRESH_TOKEN_REQUIRED: "Refresh token requis.",
  INVALID_REFRESH_TOKEN: "Refresh token invalide ou expiré.",
  NOT_FOUND: "Ressource introuvable.",
  FILE_MISSING: "Fichier manquant.",
};

export const SUCCESS = {
  // User
  USER_UPDATED: "Utilisateur mis à jour avec succès.",
  USER_DELETED: "Utilisateur et accès au pack supprimés avec succès.",
  USERS_FETCHED: "Users récupérés avec succès",
  OWNERS_FETCHED: "Liste des propriétaires récupérés avec succès",
  USERS_BY_OWNER_FETCHED: "Users par owner récupérés avec succès",
  USER_TYPE_CREATED: "UserType créé avec succès",
  USER_CREATED: "User successfully created.",
  MEMBER_CREATED: "Member successfully created.",
  MEMBER_UPDATED: "Member successfully updated.",

  LOGIN_SUCCESS: "Connexion réussie.",
  LOGOUT_SUCCESS: "Logged out successfully",
  TOKEN_REFRESHED: "Nouveau jeton généré.",
  WELCOME_EMAIL_SUBJECT: "Hera App : Mot de passe temporaire",
  MEMBER_INVITE_SUBJECT: "Invitation à rejoindre Hera App",
  RESET_EMAIL_SUBJECT: "Réinitialisation de votre mot de passe – [HERA]",
  RESET_EMAIL_SENT: "Email de réinitialisation envoyé.",

  // Password
  PASSWORD_UPDATED: "Mot de passe mis à jour avec succès.",
  PASSWORD_RESET: "Mot de passe réinitialisé avec succès",

  // Image
  IMAGE_UPDATED: "Image utilisateur mise à jour avec succès",

  // Device Token
  TOKEN_ADDED: "Token added successfully.",
  TOKEN_DELETED: "Token supprimé avec succès.",
  
};

export const APP = {
  MONGO_CONNECTED: "Connexion à MongoDB réussie !",
  MONGO_CONNECTION_ERROR: "Erreur de connexion à MongoDB :",
  SERVER_READY: "Serveur prêt sur le port",
  HEALTH_OK: "OK",
  DEEPLINK_TO_MISSING: 'Paramètre "to" manquant.',
  DEEPLINK_TO_INVALID: 'Paramètre "to" invalide.',
};

