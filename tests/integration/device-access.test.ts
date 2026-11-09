import request from "supertest";
import app from "../../src/app";
import DeviceAccess, { AccessLevel } from "../../src/modules/device/deviceAccess.model";
import { USER_TYPE } from "../../src/modules/user/enums/userType.enum";
import { DolynkClient } from "../../src/shared/integrations/dolynk/dolynk.client";
import { useTestDatabase } from "../helpers/db";
import { bearer, createDevice, createMember, createUser, grantAccess } from "../helpers/factories";
import { mockSendEachForMulticast } from "../setup/mocks";

useTestDatabase();

const dolynk = DolynkClient as jest.Mocked<typeof DolynkClient>;

async function household() {
  const owner = await createUser({ devicesToken: ["t-owner"] });
  const device = await createDevice(owner, { deviceId: "PACK1" });
  const basic = await createMember(owner, undefined, { devicesToken: ["t-basic"] });
  const standard = await createMember(owner, undefined, { devicesToken: ["t-standard"] });
  const levelAdmin = await createMember(owner, undefined, { devicesToken: ["t-admin"] });
  const noAccess = await createMember(owner, undefined, { devicesToken: ["t-none"] });
  const adminUser = await createMember(owner, USER_TYPE.ADMIN, { devicesToken: ["t-admin-user"] });
  await grantAccess(basic, device, AccessLevel.BASIC);
  await grantAccess(standard, device, AccessLevel.STANDARD);
  await grantAccess(levelAdmin, device, AccessLevel.ADMIN);

  const otherOwner = await createUser();
  const otherDevice = await createDevice(otherOwner, { deviceId: "OTHER" });
  return { owner, device, basic, standard, levelAdmin, noAccess, adminUser, otherOwner, otherDevice };
}

/** FCM calls made during the test, split by visible / data-only. */
function pushes() {
  return mockSendEachForMulticast.mock.calls.map(([msg]) => ({
    tokens: [...msg.tokens].sort(),
    visible: Boolean(msg.notification),
    data: msg.data,
  }));
}

const ACCESS_DENIED = { code: "DEVICE_ACCESS_DENIED", message: expect.any(String) };

describe("device endpoints refuse users whose access does not allow it", () => {
  beforeEach(() => {
    dolynk.getAreaArmMode.mockResolvedValue({ data: { armModes: [{ mode: "D" }] } } as any);
    dolynk.getPirCamSnapUrl.mockResolvedValue({ data: { picUrl: "https://cdn.test/p.jpg" } } as any);
    dolynk.getAccessoriesInfo.mockResolvedValue({ data: { accessoryInfos: [] } } as any);
    dolynk.getAccessoryStatus.mockResolvedValue({ data: { accessoryStatus: [{}] } } as any);
  });

  const level1Endpoints: [string, object][] = [
    ["/api/packs/set-area-arm", { deviceId: "PACK1", isArmed: true }],
    ["/api/packs/get-area-arm", { deviceId: "PACK1" }],
    ["/api/packs/get-screenshot-url", { deviceId: "PACK1", accessoryId: "a1", channel: 0 }],
    ["/api/packs/get-accessories-info", { deviceId: "PACK1" }],
    ["/api/packs/get-accessory-status", { deviceId: "PACK1", accessoryId: "a1" }],
  ];

  it.each(level1Endpoints)("%s: 403 DEVICE_ACCESS_DENIED without access, 200 for level 1", async (url, body) => {
    const h = await household();

    const denied = await request(app).post(url).set("Authorization", bearer(h.noAccess)).send(body);
    expect(denied.status).toBe(403);
    expect(denied.body).toEqual(ACCESS_DENIED);

    const allowed = await request(app).post(url).set("Authorization", bearer(h.basic)).send(body);
    expect(allowed.status).toBe(200);
  });

  it("a member whose access was removed is refused on their next call", async () => {
    const h = await household();
    await DeviceAccess.deleteOne({ userId: h.basic._id });

    const res = await request(app)
      .post("/api/packs/set-area-arm")
      .set("Authorization", bearer(h.basic))
      .send({ deviceId: "PACK1", isArmed: true });

    expect(res.status).toBe(403);
    expect(res.body).toEqual(ACCESS_DENIED);
    expect(dolynk.setAreaArmMode).not.toHaveBeenCalled();
  });

  it("set-accessory (settings): 403 for level 2, 200 for level 3", async () => {
    const h = await household();
    const body = { deviceId: "PACK1", id: "a1", type: "PIR" };

    const denied = await request(app).put("/api/packs/set-accessory").set("Authorization", bearer(h.standard)).send(body);
    expect(denied.status).toBe(403);
    expect(denied.body).toEqual(ACCESS_DENIED);
    expect(dolynk.setAccessory).not.toHaveBeenCalled();

    const allowed = await request(app).put("/api/packs/set-accessory").set("Authorization", bearer(h.levelAdmin)).send(body);
    expect(allowed.status).toBe(200);
  });

  it("an unknown device returns 404 DEVICE_NOT_FOUND", async () => {
    const h = await household();
    const res = await request(app)
      .post("/api/packs/set-area-arm")
      .set("Authorization", bearer(h.owner))
      .send({ deviceId: "NOPE", isArmed: true });
    expect(res.status).toBe(404);
    expect(res.body.code).toBe("DEVICE_NOT_FOUND");
  });
});

describe("status pushes (armed / disarmed)", () => {
  it("visible for the owner and level >= 2, data-only for level 1, nothing without access", async () => {
    const h = await household();

    const res = await request(app)
      .post("/api/packs/set-area-arm")
      .set("Authorization", bearer(h.standard))
      .send({ deviceId: "PACK1", isArmed: true });
    expect(res.status).toBe(200);

    const sent = pushes();
    const visibleTokens = sent.filter((p) => p.visible).flatMap((p) => p.tokens).sort();
    const silent = sent.filter((p) => !p.visible);

    expect(visibleTokens).toEqual(["t-admin", "t-owner", "t-standard"]);
    expect(silent).toHaveLength(1);
    expect(silent[0].tokens).toEqual(["t-basic"]);
    expect(silent[0].data).toMatchObject({ msgType: "armed", deviceId: "PACK1" });
  });

  it("a level 1 member who arms gets a data-only push, others are notified by name", async () => {
    const h = await household();
    await request(app)
      .post("/api/packs/set-area-arm")
      .set("Authorization", bearer(h.basic))
      .send({ deviceId: "PACK1", isArmed: false });

    const sent = pushes();
    expect(sent.find((p) => !p.visible)!.tokens).toEqual(["t-basic"]);
    expect(sent.filter((p) => p.visible).flatMap((p) => p.tokens).sort()).toEqual(["t-admin", "t-owner", "t-standard"]);
  });

  it("other events (e.g. alarms) are not sent to level 1", async () => {
    const h = await household();
    dolynk.getPirCamSnapUrl.mockResolvedValue({ data: { picUrl: "https://cdn.test/p.jpg" } } as any);
    await request(app)
      .post("/api/packs/get-screenshot-url")
      .set("Authorization", bearer(h.owner))
      .send({ deviceId: "PACK1", accessoryId: "a1", channel: 0 });

    expect(pushes().flatMap((p) => p.tokens)).not.toContain("t-basic");
  });
});

describe("access-change push", () => {
  const setAccess = (auth: string, userId: string, accessList: object[]) =>
    request(app).post("/api/packs/access").set("Authorization", auth).send({ userId, accessList });

  it("sends the member a data-only push with msgType and deviceId", async () => {
    const h = await household();
    const res = await setAccess(bearer(h.owner), h.noAccess._id.toString(), [
      { deviceId: h.device._id.toString(), accessLevel: AccessLevel.STANDARD },
    ]);

    expect(res.status).toBe(200);
    expect(pushes()).toEqual([
      { tokens: ["t-none"], visible: false, data: { msgType: "accessChanged", deviceId: "PACK1", accessLevel: "2" } },
    ]);
  });

  it("also on removal (level 0), and not when the level is unchanged", async () => {
    const h = await household();
    await setAccess(bearer(h.owner), h.basic._id.toString(), [
      { deviceId: h.device._id.toString(), accessLevel: AccessLevel.NONE },
    ]);
    expect(pushes()).toEqual([
      { tokens: ["t-basic"], visible: false, data: { msgType: "accessChanged", deviceId: "PACK1", accessLevel: "0" } },
    ]);

    mockSendEachForMulticast.mockClear();
    await setAccess(bearer(h.owner), h.standard._id.toString(), [
      { deviceId: h.device._id.toString(), accessLevel: AccessLevel.STANDARD },
    ]);
    expect(pushes()).toEqual([]);
  });

  it("when the member is deleted", async () => {
    const h = await household();
    const res = await request(app).delete(`/api/users/${h.standard._id}`).set("Authorization", bearer(h.owner));

    expect(res.status).toBe(200);
    expect(pushes()).toEqual([
      { tokens: ["t-standard"], visible: false, data: { msgType: "accessChanged", deviceId: "PACK1", accessLevel: "0" } },
    ]);
  });

  it("only an OWNER/ADMIN of the same household can change access, never their own", async () => {
    const h = await household();
    const grant = [{ deviceId: h.device._id.toString(), accessLevel: AccessLevel.ADMIN }];

    expect((await setAccess(bearer(h.basic), h.noAccess._id.toString(), grant)).status).toBe(403);
    expect((await setAccess(bearer(h.basic), h.basic._id.toString(), grant)).status).toBe(403);
    expect((await setAccess(bearer(h.adminUser), h.adminUser._id.toString(), grant)).status).toBe(403);
    expect((await setAccess(bearer(h.otherOwner), h.noAccess._id.toString(), grant)).status).toBe(403);
    expect((await setAccess(bearer(h.adminUser), h.noAccess._id.toString(), grant)).status).toBe(200);
  });

  it("refuses devices from another household", async () => {
    const h = await household();
    const res = await setAccess(bearer(h.owner), h.noAccess._id.toString(), [
      { deviceId: h.otherDevice._id.toString(), accessLevel: AccessLevel.ADMIN },
    ]);
    expect(res.status).toBe(404);
    expect(await DeviceAccess.countDocuments({ userId: h.noAccess._id })).toBe(0);
    expect(pushes()).toEqual([]);
  });
});

describe("update-member: accessList is the complete selection", () => {
  async function twoPacks() {
    const h = await household();
    const pack2 = await createDevice(h.owner, { deviceId: "PACK2" });
    await grantAccess(h.basic, pack2, AccessLevel.BASIC); // basic now has PACK1 + PACK2
    return { ...h, pack2 };
  }

  const updateMember = (auth: string, member: { _id: object }, accessList?: object[]) =>
    request(app)
      .put("/api/users/update-member")
      .set("Authorization", auth)
      .send({ _id: String(member._id), name: "Renamed", ...(accessList && { accessList }) });

  const levels = async (userId: object) =>
    Object.fromEntries(
      (await DeviceAccess.find({ userId }).populate<{ device: { deviceId: string } }>("device").lean())
        .map((a) => [a.device.deviceId, a.accessLevel])
    );

  beforeEach(() => jest.spyOn(console, "log").mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it("removes access to a device left out of the list (unchecked) and notifies the member", async () => {
    const h = await twoPacks();
    const res = await updateMember(bearer(h.owner), h.basic, [
      { deviceId: h.device._id.toString(), accessLevel: AccessLevel.BASIC },
    ]);

    expect(res.status).toBe(200);
    expect(await levels(h.basic._id)).toEqual({ PACK1: AccessLevel.BASIC });
    expect(pushes()).toEqual([
      { tokens: ["t-basic"], visible: false, data: { msgType: "accessChanged", deviceId: "PACK2", accessLevel: "0" } },
    ]);
  });

  it("an empty list removes every access", async () => {
    const h = await twoPacks();
    await updateMember(bearer(h.owner), h.basic, []);
    expect(await levels(h.basic._id)).toEqual({});
  });

  it("no accessList in the body leaves access unchanged", async () => {
    const h = await twoPacks();
    await updateMember(bearer(h.owner), h.basic);
    expect(await levels(h.basic._id)).toEqual({ PACK1: AccessLevel.BASIC, PACK2: AccessLevel.BASIC });
    expect(pushes()).toEqual([]);
  });

  it("sending the same selection changes nothing and sends no push", async () => {
    const h = await twoPacks();
    await updateMember(bearer(h.owner), h.basic, [
      { deviceId: h.device._id.toString(), accessLevel: AccessLevel.BASIC },
      { deviceId: h.pack2._id.toString(), accessLevel: AccessLevel.BASIC },
    ]);
    expect(pushes()).toEqual([]);
  });
});
