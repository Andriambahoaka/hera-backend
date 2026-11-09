import crypto from "crypto";
import request from "supertest";
import app from "../../src/app";
import { AccessLevel } from "../../src/modules/device/deviceAccess.model";
import { useTestDatabase } from "../helpers/db";
import { createDevice, createMember, createUser, grantAccess } from "../helpers/factories";
import { mockSendEachForMulticast } from "../setup/mocks";

useTestDatabase();

function signedAlarm(deviceId: string) {
  const id = String(Date.now()) + Math.floor(Math.random() * 1000);
  return {
    id,
    deviceId,
    msgType: "AlarmLocal",
    utcTime: String(Date.now()),
    productId: process.env.DOLYNK_PRODUCT_ID,
    accessKey: process.env.DOLYNK_ACCESS_KEY,
    sign: crypto.createHmac("sha512", process.env.DOLYNK_SECRET_ACCESS_KEY!).update(id).digest("hex"),
  };
}

const sentTokens = () => mockSendEachForMulticast.mock.calls.flatMap(([msg]) => msg.tokens).sort();

describe("push notification recipients", () => {
  beforeEach(() => jest.spyOn(console, "warn").mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it("go to the owner and users with level >= 2 only", async () => {
    const owner = await createUser({ devicesToken: ["t-owner"] });
    const device = await createDevice(owner, { deviceId: "PACK1" });

    const basic = await createMember(owner, undefined, { devicesToken: ["t-basic"] });
    const standard = await createMember(owner, undefined, { devicesToken: ["t-standard"] });
    const admin = await createMember(owner, undefined, { devicesToken: ["t-admin"] });
    await createMember(owner, undefined, { devicesToken: ["t-no-access"] });
    await grantAccess(basic, device, AccessLevel.BASIC);
    await grantAccess(standard, device, AccessLevel.STANDARD);
    await grantAccess(admin, device, AccessLevel.ADMIN);

    // Level 3 on another device of the same owner gives nothing on PACK1.
    const otherDevice = await createDevice(owner, { deviceId: "PACK2" });
    const elsewhere = await createMember(owner, undefined, { devicesToken: ["t-elsewhere"] });
    await grantAccess(elsewhere, otherDevice, AccessLevel.ADMIN);

    const res = await request(app).post("/api/notifications").send(signedAlarm("PACK1"));

    expect(res.status).toBe(200);
    expect(sentTokens()).toEqual(["t-admin", "t-owner", "t-standard"]);
  });
});
