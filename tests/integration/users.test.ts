import request from "supertest";
import app from "../../src/app";
import User from "../../src/modules/user/user.model";
import { useTestDatabase } from "../helpers/db";
import { bearer, createMember, createUser, DEFAULT_PASSWORD } from "../helpers/factories";

useTestDatabase();

const FCM_TOKEN = "fcm-token-must-not-leak";

/** True if a bcrypt hash, a push token, or a "password"/"devicesToken" key appears anywhere in the body. */
const exposesPassword = (body: unknown) => {
  const json = JSON.stringify(body);
  return (
    /"password"\s*:/.test(json) ||
    /\$2[aby]\$\d{2}\$/.test(json) ||
    /"devicesToken"\s*:/.test(json) ||
    json.includes(FCM_TOKEN)
  );
};

describe("user responses never include the password hash or push tokens", () => {
  beforeEach(() => jest.spyOn(console, "log").mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it("PUT /api/users/update-member", async () => {
    const owner = await createUser({ devicesToken: [FCM_TOKEN] });
    const member = await createMember(owner, undefined, { devicesToken: [FCM_TOKEN] });
    const res = await request(app)
      .put("/api/users/update-member")
      .set("Authorization", bearer(owner))
      .send({ _id: member._id.toString(), name: "Renamed" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Renamed");
    expect(exposesPassword(res.body)).toBe(false);
  });

  it.each(["/api/users/me", "/api/users/members"])("GET %s", async (url) => {
    const owner = await createUser({ devicesToken: [FCM_TOKEN] });
    await createMember(owner, undefined, { devicesToken: [FCM_TOKEN] });
    const res = await request(app).get(url).set("Authorization", bearer(owner));

    expect(res.status).toBe(200);
    expect(exposesPassword(res.body)).toBe(false);
  });

  it("POST /api/auth/login", async () => {
    const owner = await createUser({ email: "login@test.local", devicesToken: [FCM_TOKEN] });
    const res = await request(app).post("/api/auth/login").send({ email: owner.email, password: DEFAULT_PASSWORD });

    expect(res.status).toBe(200);
    expect(exposesPassword(res.body)).toBe(false);
  });

  it("a user document serialized after loading the hash still hides it", async () => {
    const owner = await createUser();
    const loaded = await User.findById(owner._id).select("+password +devicesToken");
    expect(loaded!.password).toMatch(/^\$2/);
    expect(loaded!.devicesToken).toEqual([]);
    expect(exposesPassword(loaded!.toJSON())).toBe(false);
  });
});

describe("password checks still work with the hash hidden by default", () => {
  it("PUT /api/users/update-password: wrong old password refused, right one accepted, new one logs in", async () => {
    const owner = await createUser({ email: "change@test.local" });
    const auth = bearer(owner);

    const wrong = await request(app)
      .put("/api/users/update-password")
      .set("Authorization", auth)
      .send({ oldPassword: "Wrong123!", newPassword: "NewPassword123!" });
    expect(wrong.status).toBeGreaterThanOrEqual(400);

    const ok = await request(app)
      .put("/api/users/update-password")
      .set("Authorization", auth)
      .send({ oldPassword: DEFAULT_PASSWORD, newPassword: "NewPassword123!" });
    expect(ok.status).toBe(200);
    expect(exposesPassword(ok.body)).toBe(false);

    const login = await request(app).post("/api/auth/login").send({ email: "change@test.local", password: "NewPassword123!" });
    expect(login.status).toBe(200);
  });
});
