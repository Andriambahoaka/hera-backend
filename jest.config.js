/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
  // One in-memory MongoDB replica set for the whole run (supports transactions).
  globalSetup: "<rootDir>/tests/setup/globalSetup.ts",
  globalTeardown: "<rootDir>/tests/setup/globalTeardown.ts",
  // Test env vars, set before any module is imported.
  setupFiles: ["<rootDir>/tests/setup/env.ts"],
  // Mocks for external services (Firebase, email, Dolynk, Cloudinary).
  setupFilesAfterEnv: ["<rootDir>/tests/setup/mocks.ts"],
  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts", "!src/**/*.d.ts"],
  testTimeout: 20000,
};
