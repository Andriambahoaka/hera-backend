import request from "supertest";
import app from "../../src/app";
import { useTestDatabase } from "../helpers/db";
import { accessTokenFor, createUser, DEFAULT_PASSWORD } from "../helpers/factories";

useTestDatabase();

describe("POST /api/auth/login", () => {
  it("returns tokens and the user without sensitive fields", async () => {
    const user = await createUser({ email: "owner@test.local" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "owner@test.local", password: DEFAULT_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.refreshToken).toEqual(expect.any(String));
    expect(res.body.user._id).toBe(user._id.toString());
    expect(res.body.user).not.toHaveProperty("password");
    expect(res.body.user).not.toHaveProperty("devicesToken");
  });

  it("rejects a wrong password with 401", async () => {
    await createUser({ email: "owner@test.local" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "owner@test.local", password: "wrong" });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects an unknown email with the same 401 (no user enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.local", password: DEFAULT_PASSWORD });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("GET /api/users/me", () => {
  it("returns the current user without sensitive fields", async () => {
    const user = await createUser();

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessTokenFor(user._id)}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(user._id.toString());
    expect(res.body).not.toHaveProperty("password");
    expect(res.body).not.toHaveProperty("devicesToken");
  });

  it("rejects a request without a token", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
  });

  it("rejects a token signed with another secret", async () => {
    const user = await createUser();
    const forged = require("jsonwebtoken").sign({ userId: user._id.toString() }, "not-the-secret");

    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });
});
