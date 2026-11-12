/**
 * Environment validation.
 *
 * `validateEnv` is pure (takes the env object, returns a result) so it can be
 * unit-tested. `loadEnv` is the startup entry point: it loads `.env`, validates,
 * and exits the process with a readable report if something is wrong.
 *
 * Values are never printed — only variable names.
 */
import dotenv from "dotenv";

type Env = Record<string, string | undefined>;

/** Required in every environment. */
const REQUIRED = [
  "MONGO_URI",
  "JWT_SECRET",
  "RESET_PASSWORD_SECRET",
  "MASTER_ADMIN_KEY",
  "MOBILE_API_KEY",
] as const;

/**
 * Required in production; only a warning in development so the API can boot
 * locally without every third-party integration configured.
 */
const REQUIRED_IN_PRODUCTION = [
  "APP_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "BREVO_EMAIL_SENDER",
  "DOLYNK_PRODUCT_ID",
  "DOLYNK_ACCESS_KEY",
  "DOLYNK_SECRET_ACCESS_KEY",
] as const;

/** Secrets that must be long enough to resist guessing. */
const SECRETS_MIN_LENGTH = 32;
const SECRETS = [
  "JWT_SECRET",
  "RESET_PASSWORD_SECRET",
  "MASTER_ADMIN_KEY",
] as const;

export type EnvValidationResult = {
  errors: string[];
  warnings: string[];
};

const isBlank = (v: string | undefined) => v === undefined || v.trim() === "";

export function validateEnv(env: Env): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = env.NODE_ENV === "production";

  for (const key of REQUIRED) {
    if (isBlank(env[key])) errors.push(`${key} is required.`);
  }

  for (const key of REQUIRED_IN_PRODUCTION) {
    if (isBlank(env[key])) {
      (isProduction ? errors : warnings).push(
        `${key} is ${isProduction ? "required in production" : "not set"}.`
      );
    }
  }

  // Email needs either the Brevo API key or both SMTP credentials.
  const hasBrevoApi = !isBlank(env.BREVO_API_KEY);
  const hasBrevoSmtp = !isBlank(env.BREVO_SMTP_USERNAME) && !isBlank(env.BREVO_SMTP_PASSWORD);
  if (!hasBrevoApi && !hasBrevoSmtp) {
    (isProduction ? errors : warnings).push(
      `BREVO_API_KEY (or BREVO_SMTP_USERNAME and BREVO_SMTP_PASSWORD) is ${isProduction ? "required in production" : "not set"}.`
    );
  }

  for (const key of SECRETS) {
    const value = env[key];
    if (!isBlank(value) && value!.length < SECRETS_MIN_LENGTH) {
      (isProduction ? errors : warnings).push(
        `${key} must be at least ${SECRETS_MIN_LENGTH} characters.`
      );
    }
  }

  if (
    !isBlank(env.JWT_SECRET) &&
    env.JWT_SECRET === env.RESET_PASSWORD_SECRET
  ) {
    // Warning only for now: reset-password currently verifies with JWT_SECRET,
    // so making them differ before the token refactor would break resets.
    warnings.push(
      "JWT_SECRET and RESET_PASSWORD_SECRET are identical; they should differ."
    );
  }

  if (!isBlank(env.PORT) && !/^\d+$/.test(env.PORT!)) {
    errors.push("PORT must be a number.");
  }

  if (isProduction && isBlank(env.CORS_ORIGINS)) {
    warnings.push("CORS_ORIGINS is empty: every origin is allowed.");
  }

  return { errors, warnings };
}

/**
 * Loads `.env` and validates the result. Exits the process on errors.
 * Must run before any module that reads `process.env` at import time.
 */
export function loadEnv(): void {
  dotenv.config();

  const { errors, warnings } = validateEnv(process.env);

  for (const w of warnings) console.warn(`[CONFIG] Warning: ${w}`);

  if (errors.length) {
    for (const e of errors) console.error(`[CONFIG] Error: ${e}`);
    console.error("[CONFIG] Invalid environment, refusing to start.");
    process.exit(1);
  }
}
