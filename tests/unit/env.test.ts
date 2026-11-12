import { validateEnv } from "../../src/core/config/env";

const SECRET = "x".repeat(40);

const validBase = {
  MONGO_URI: "mongodb://localhost:27017/test",
  JWT_SECRET: SECRET,
  RESET_PASSWORD_SECRET: "y".repeat(40),
  MASTER_ADMIN_KEY: "z".repeat(40),
  MOBILE_API_KEY: "mobile-key",
};

const productionExtras = {
  NODE_ENV: "production",
  APP_DOMAIN: "https://app.example.com",
  CORS_ORIGINS: "https://app.example.com",
  FIREBASE_PROJECT_ID: "p",
  FIREBASE_CLIENT_EMAIL: "e",
  FIREBASE_PRIVATE_KEY: "k",
  CLOUDINARY_CLOUD_NAME: "c",
  CLOUDINARY_API_KEY: "c",
  CLOUDINARY_API_SECRET: "c",
  BREVO_SMTP_USERNAME: "b",
  BREVO_SMTP_PASSWORD: "b",
  BREVO_EMAIL_SENDER: "b",
  DOLYNK_PRODUCT_ID: "d",
  DOLYNK_ACCESS_KEY: "d",
  DOLYNK_SECRET_ACCESS_KEY: "d",
};

describe("validateEnv", () => {
  it("accepts a complete development env", () => {
    const { errors } = validateEnv(validBase);
    expect(errors).toEqual([]);
  });

  it("accepts a complete production env with no warnings", () => {
    const result = validateEnv({ ...validBase, ...productionExtras });
    expect(result).toEqual({ errors: [], warnings: [] });
  });

  it.each(["MONGO_URI", "JWT_SECRET", "RESET_PASSWORD_SECRET", "MASTER_ADMIN_KEY", "MOBILE_API_KEY"])(
    "rejects a missing %s",
    (key) => {
      const env = { ...validBase, [key]: undefined };
      expect(validateEnv(env).errors).toContain(`${key} is required.`);
    }
  );

  it("treats whitespace-only values as missing", () => {
    const { errors } = validateEnv({ ...validBase, JWT_SECRET: "   " });
    expect(errors).toContain("JWT_SECRET is required.");
  });

  it("only warns about missing integrations outside production", () => {
    const { errors, warnings } = validateEnv(validBase);
    expect(errors).toEqual([]);
    expect(warnings).toContain("DOLYNK_ACCESS_KEY is not set.");
  });

  it("requires integrations in production", () => {
    const env = { ...validBase, ...productionExtras, DOLYNK_ACCESS_KEY: "" };
    expect(validateEnv(env).errors).toContain(
      "DOLYNK_ACCESS_KEY is required in production."
    );
  });

  it("accepts a Brevo API key instead of SMTP credentials", () => {
    const env = { ...validBase, ...productionExtras, BREVO_SMTP_USERNAME: "", BREVO_SMTP_PASSWORD: "", BREVO_API_KEY: "k" };
    expect(validateEnv(env).errors).toEqual([]);
  });

  it("requires a Brevo API key or SMTP credentials in production", () => {
    const env = { ...validBase, ...productionExtras, BREVO_SMTP_PASSWORD: "", BREVO_API_KEY: "" };
    expect(validateEnv(env).errors.join(" ")).toMatch(/BREVO_API_KEY/);
  });

  it("rejects short secrets in production", () => {
    const env = { ...validBase, ...productionExtras, JWT_SECRET: "short" };
    expect(validateEnv(env).errors).toContain(
      "JWT_SECRET must be at least 32 characters."
    );
  });

  it("only warns about short secrets outside production", () => {
    const { errors, warnings } = validateEnv({ ...validBase, JWT_SECRET: "short" });
    expect(errors).toEqual([]);
    expect(warnings).toContain("JWT_SECRET must be at least 32 characters.");
  });

  it("warns when JWT and reset secrets are identical", () => {
    const env = { ...validBase, RESET_PASSWORD_SECRET: SECRET };
    expect(validateEnv(env).warnings).toContain(
      "JWT_SECRET and RESET_PASSWORD_SECRET are identical; they should differ."
    );
  });

  it("rejects a non-numeric PORT", () => {
    expect(validateEnv({ ...validBase, PORT: "abc" }).errors).toContain(
      "PORT must be a number."
    );
  });

  it("warns about open CORS in production", () => {
    const env = { ...validBase, ...productionExtras, CORS_ORIGINS: "" };
    expect(validateEnv(env).warnings).toContain(
      "CORS_ORIGINS is empty: every origin is allowed."
    );
  });

  it("never includes secret values in messages", () => {
    const env = { ...validBase, ...productionExtras, JWT_SECRET: "leaky-value" };
    const { errors, warnings } = validateEnv(env);
    expect([...errors, ...warnings].join(" ")).not.toContain("leaky-value");
  });
});
