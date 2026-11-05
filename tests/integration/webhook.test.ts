import crypto from "crypto";
import request from "supertest";
import app from "../../src/app";
import Notification from "../../src/modules/notification/notification.model";
import { MAX_EVENT_AGE_MS } from "../../src/modules/notification/dolynk.webhook";
import { useTestDatabase } from "../helpers/db";
import { createDevice, createUser } from "../helpers/factories";
import { mockSendEachForMulticast } from "../setup/mocks";

useTestDatabase();

let eventCounter = 0;

/** Builds an event shaped like the real Dolynk payload, signed with the test secret. */
function signedEvent(overrides: Record<string, unknown> = {}, secret = process.env.DOLYNK_SECRET_ACCESS_KEY!) {
  eventCounter += 1;
  const now = String(Date.now());
  const event: Record<string, unknown> = {
    localTime: now,
    msgType: "AlarmLocal",
    areaId: 913,
    productId: process.env.DOLYNK_PRODUCT_ID,
    accessKey: process.env.DOLYNK_ACCESS_KEY,
    utcTime: now,
    action: "start",
    accessoryId: "acc-1",
    id: `3865097697758651${String(eventCounter).padStart(2, "0")}`,
    category: "ARC",
    deviceId: "J5Y5A7QZW59C",
    ...overrides,
  };
  event.sign = crypto.createHmac("sha512", secret).update(String(event.id)).digest("hex");
  return event;
}

const post = (body: object) => request(app).post("/api/notifications").send(body);

describe("POST /api/notifications (Dolynk webhook)", () => {
  let owner: Awaited<ReturnType<typeof createUser>>;

  beforeEach(async () => {
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
    owner = await createUser({ devicesToken: ["owner-fcm-token"] });
    await createDevice(owner, { deviceId: "J5Y5A7QZW59C", deviceName: "Maison" });
  });

  afterEach(() => jest.restoreAllMocks());

  describe("signature", () => {
    it("rejects a request without sign", async () => {
      const { sign, ...unsigned } = signedEvent();
      const res = await post(unsigned);
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_WEBHOOK_SIGNATURE");
      expect(await Notification.countDocuments()).toBe(0);
    });

    it("rejects a sign made with another secret", async () => {
      const res = await post(signedEvent({}, "not-our-secret"));
      expect(res.status).toBe(401);
    });

    it("rejects a valid sign reused with another id", async () => {
      const event = signedEvent();
      const res = await post({ ...event, id: "999" });
      expect(res.status).toBe(401);
    });

    it("rejects a malformed sign without crashing", async () => {
      const res = await post({ ...signedEvent(), sign: "abc" });
      expect(res.status).toBe(401);
    });

    it("accepts a valid sign in uppercase", async () => {
      const event = signedEvent();
      const res = await post({ ...event, sign: String(event.sign).toUpperCase() });
      expect(res.status).toBe(200);
    });
  });

  describe("valid event", () => {
    it("stores the notification, pushes to the owner and returns a minimal body", async () => {
      const res = await post(signedEvent({ filePath: "https://cdn.test/pic.jpg" }));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ received: true });

      const stored = await Notification.findOne().lean();
      expect(stored).toMatchObject({
        deviceId: "J5Y5A7QZW59C",
        msgType: "AlarmLocal",
        filePath: "https://cdn.test/pic.jpg",
        device: { deviceName: "Maison" },
      });
      expect(String(stored!.device.ownerId)).toBe(owner._id.toString());

      expect(mockSendEachForMulticast).toHaveBeenCalledTimes(1);
      expect(mockSendEachForMulticast.mock.calls[0][0].tokens).toEqual(["owner-fcm-token"]);
    });

    it("ignores userId and unknown fields from the payload", async () => {
      const intruder = await createUser();
      await post(signedEvent({ userId: intruder._id.toString(), isAdmin: true }));

      const stored = await Notification.findOne().lean();
      expect(stored!.userId).toBeUndefined();
      expect(stored).not.toHaveProperty("isAdmin");
      expect(stored).not.toHaveProperty("sign");
    });
  });

  describe("events that are acknowledged but not processed", () => {
    it("processes a repeated event id only once", async () => {
      const event = signedEvent();
      expect((await post(event)).status).toBe(200);
      const replay = await post({ ...event, msgType: "SensorAbnormal" });

      expect(replay.status).toBe(200);
      expect(replay.body).toEqual({ received: true });
      expect(await Notification.countDocuments()).toBe(1);
      expect(mockSendEachForMulticast).toHaveBeenCalledTimes(1);
    });

    it("ignores an unknown deviceId", async () => {
      const res = await post(signedEvent({ deviceId: "UNKNOWN" }));
      expect(res.status).toBe(200);
      expect(await Notification.countDocuments()).toBe(0);
    });

    it("ignores an event outside the time window", async () => {
      const old = String(Date.now() - MAX_EVENT_AGE_MS - 60_000);
      const res = await post(signedEvent({ utcTime: old }));
      expect(res.status).toBe(200);
      expect(await Notification.countDocuments()).toBe(0);
    });

    it("ignores an event without msgType", async () => {
      const res = await post(signedEvent({ msgType: undefined }));
      expect(res.status).toBe(200);
      expect(await Notification.countDocuments()).toBe(0);
    });
  });

  it("lets Dolynk retry an event whose processing failed", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockSendEachForMulticast.mockRejectedValueOnce(new Error("FCM down"));
    const event = signedEvent();

    expect((await post(event)).status).toBe(500);
    expect((await post(event)).status).toBe(200);
    expect(mockSendEachForMulticast).toHaveBeenCalledTimes(2);
  });
});
