// Global mocks for external services, so tests never hit the network.
// Individual tests can inspect or override them, e.g.:
//   import * as emailService from "../../src/infrastructure/email/email.service";
//   expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith(...)

// Firebase: the real module calls initializeApp() with credentials at import.
export const mockSendEachForMulticast = jest.fn().mockResolvedValue({
  successCount: 0,
  failureCount: 0,
  responses: [],
});

jest.mock("../../src/core/config/firebase", () => ({
  __esModule: true,
  default: {
    messaging: () => ({ sendEachForMulticast: mockSendEachForMulticast }),
  },
}));

jest.mock("../../src/infrastructure/email/email.service", () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../../src/core/config/cloudinary", () => ({
  __esModule: true,
  default: {
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn().mockResolvedValue({ result: "ok" }),
    },
  },
}));

// Dolynk: every method is an auto-mocked jest.fn(); set return values per test.
jest.mock("../../src/shared/integrations/dolynk/dolynk.client");

afterEach(() => {
  jest.clearAllMocks();
});
