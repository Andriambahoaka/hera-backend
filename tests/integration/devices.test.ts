import request from "supertest";
import app from "../../src/app";
import Device from "../../src/modules/device/device.model";
import { AccessLevel } from "../../src/modules/device/deviceAccess.model";
import { USER_TYPE } from "../../src/modules/user/enums/userType.enum";
import { useTestDatabase } from "../helpers/db";
import { bearer, createDevice, createMember, createUser, grantAccess } from "../helpers/factories";

useTestDatabase();

async function household() {
  const owner = await createUser();
  const device = await createDevice(owner, { deviceId: "PACK1", deviceName: "Maison" });
  const basic = await createMember(owner);
  const standard = await createMember(owner);
  const levelAdmin = await createMember(owner);
  const adminUser = await createMember(owner, USER_TYPE.ADMIN);
  await grantAccess(basic, device, AccessLevel.BASIC);
  await grantAccess(standard, device, AccessLevel.STANDARD);
  await grantAccess(levelAdmin, device, AccessLevel.ADMIN);

  const otherOwner = await createUser();
  const otherMember = await createMember(otherOwner);
  return { owner, device, basic, standard, levelAdmin, adminUser, otherOwner, otherMember };
}

describe("PUT /api/packs", () => {
  const put = (auth?: string) => {
    const req = request(app).put("/api/packs");
    return auth ? req.set("Authorization", auth) : req;
  };

  it("requires authentication", async () => {
    await household();
    const res = await put().send({ deviceId: "PACK1", deviceName: "x" });
    expect(res.status).toBe(401);
  });

  it("refuses users with no access (403)", async () => {
    const h = await household();
    const res = await put(bearer(h.otherOwner)).send({ deviceId: "PACK1", deviceName: "x" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("DEVICE_ACCESS_DENIED");
  });

  it("rejects level 2 (403)", async () => {
    const h = await household();
    const res = await put(bearer(h.standard)).send({ deviceId: "PACK1", deviceName: "x" });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("DEVICE_ACCESS_DENIED");
  });

  it.each([
    ["the owner", "owner"],
    ["a level 3 member", "levelAdmin"],
  ] as const)("allows %s", async (_label, who) => {
    const h = await household();
    const res = await put(bearer(h[who])).send({ deviceId: "PACK1", deviceName: "Chalet", urgencyNumber: "112" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ deviceName: "Chalet", urgencyNumber: "112" });
  });

  it("only updates deviceName and urgencyNumber", async () => {
    const h = await household();
    const res = await put(bearer(h.owner)).send({
      deviceId: "PACK1",
      deviceName: "Chalet",
      ownerId: h.otherOwner._id.toString(),
      devCode: "hijacked",
    });
    expect(res.status).toBe(200);

    const stored = await Device.findOne({ deviceId: "PACK1" }).select("+devCode").lean();
    expect(String(stored!.ownerId)).toBe(h.owner._id.toString());
    expect(stored!.devCode).not.toBe("hijacked");
  });

  it("rejects a body with no updatable field, or a non-string value", async () => {
    const h = await household();
    expect((await put(bearer(h.owner)).send({ deviceId: "PACK1", ownerId: "x" })).status).toBe(400);
    expect((await put(bearer(h.owner)).send({ deviceId: "PACK1", deviceName: { $gt: "" } })).status).toBe(400);
  });
});

describe("GET /api/packs/:deviceId", () => {
  it("requires authentication", async () => {
    await household();
    expect((await request(app).get("/api/packs/PACK1")).status).toBe(401);
  });

  it("returns 403 to users with no access", async () => {
    const h = await household();
    const res = await request(app).get("/api/packs/PACK1").set("Authorization", bearer(h.otherMember));
    expect(res.status).toBe(403);
  });

  it("allows level 1 and never returns devCode", async () => {
    const h = await household();
    const res = await request(app).get("/api/packs/PACK1").set("Authorization", bearer(h.basic));
    expect(res.status).toBe(200);
    expect(res.body.deviceId).toBe("PACK1");
    expect(res.body).not.toHaveProperty("devCode");
  });
});

describe("GET /api/packs/access/:userId", () => {
  const get = (userId: string, auth?: string) => {
    const req = request(app).get(`/api/packs/access/${userId}`);
    return auth ? req.set("Authorization", auth) : req;
  };

  it("requires authentication", async () => {
    const h = await household();
    expect((await get(h.basic._id.toString())).status).toBe(401);
  });

  it("allows a user to see their own access", async () => {
    const h = await household();
    const res = await get(h.basic._id.toString(), bearer(h.basic));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([expect.objectContaining({ accessLevel: AccessLevel.BASIC })]);
    expect(res.body[0].device).not.toHaveProperty("devCode");
  });

  it.each(["owner", "adminUser"] as const)("allows the %s of the same household", async (who) => {
    const h = await household();
    expect((await get(h.basic._id.toString(), bearer(h[who]))).status).toBe(200);
  });

  it("rejects a member looking at another member", async () => {
    const h = await household();
    const res = await get(h.standard._id.toString(), bearer(h.basic));
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("NOT_SAME_HOUSEHOLD");
  });

  it("rejects an owner from another household", async () => {
    const h = await household();
    expect((await get(h.basic._id.toString(), bearer(h.otherOwner))).status).toBe(403);
  });

  it("rejects an invalid id", async () => {
    const h = await household();
    expect((await get("not-an-id", bearer(h.owner))).status).toBe(400);
  });
});

describe("devCode is never returned", () => {
  it("GET /api/packs/owner and /granted-access", async () => {
    const h = await household();
    const owned = await request(app).get("/api/packs/owner").set("Authorization", bearer(h.owner));
    const granted = await request(app).get("/api/packs/granted-access").set("Authorization", bearer(h.basic));

    expect(owned.status).toBe(200);
    expect(granted.status).toBe(200);
    expect(JSON.stringify(owned.body)).not.toContain("devCode");
    expect(JSON.stringify(granted.body)).not.toContain("devCode");
  });

  it("is still available to the Dolynk client when explicitly selected", async () => {
    await household();
    const device = await Device.findOne({ deviceId: "PACK1" }).select("+devCode");
    expect(device!.devCode).toMatch(/^Dolynk_/);
  });
});
