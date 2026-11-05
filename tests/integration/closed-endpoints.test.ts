import request from "supertest";
import app from "../../src/app";
import { useTestDatabase } from "../helpers/db";
import { bearer, createUser } from "../helpers/factories";

useTestDatabase();

describe("endpoints closed in Phase 2", () => {
  it("POST /api/activities no longer exists", async () => {
    const owner = await createUser();
    const res = await request(app)
      .post("/api/activities")
      .set("Authorization", bearer(owner))
      .send({ ownerId: owner._id.toString(), type: "armed" });
    expect(res.status).toBe(404);
  });

  it("GET /api/activities still works for authenticated users", async () => {
    const owner = await createUser();
    const res = await request(app).get("/api/activities").set("Authorization", bearer(owner));
    expect(res.status).not.toBe(404);
    expect(res.status).not.toBe(401);
  });

  describe("POST /api/user-types", () => {
    it("rejects requests without the admin key", async () => {
      const res = await request(app).post("/api/user-types").send({ type_id: 9, name: "x" });
      expect(res.status).toBe(401);
      expect(res.body.code).toBe("INVALID_ADMIN_KEY");
    });

    it("rejects a wrong admin key", async () => {
      const res = await request(app)
        .post("/api/user-types")
        .set("x-admin-key", "wrong")
        .send({ type_id: 9, name: "x" });
      expect(res.status).toBe(401);
    });

    it("accepts the admin key", async () => {
      const res = await request(app)
        .post("/api/user-types")
        .set("x-admin-key", process.env.MASTER_ADMIN_KEY!)
        .send({ type_id: 9, name: "x" });
      expect(res.status).toBe(200);
    });
  });
});
