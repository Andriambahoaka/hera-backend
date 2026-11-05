// Fake, test-only values. Runs before each test file, before any app module
// is imported, so modules that read process.env at import time see these.
// Never put real credentials here.
Object.assign(process.env, {
  NODE_ENV: "test",
  JWT_SECRET: "test-jwt-secret-0123456789abcdef0123456789",
  RESET_PASSWORD_SECRET: "test-reset-secret-0123456789abcdef012345",
  MASTER_ADMIN_KEY: "test-admin-key-0123456789abcdef0123456789",
  MOBILE_API_KEY: "test-mobile-key",
  APP_DOMAIN: "https://app.test",
  CORS_ORIGINS: "",
  DOLYNK_PRODUCT_ID: "test-product",
  DOLYNK_ACCESS_KEY: "test-access-key",
  DOLYNK_SECRET_ACCESS_KEY: "test-secret-access-key",
});
