import request from "supertest";
import app from "../../src/app";

// These routes don't touch the database.
describe("app", () => {
  it("GET /healthz returns OK", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.text).toBe("OK");
  });

  it("does not advertise Express", async () => {
    const res = await request(app).get("/healthz");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });

  describe("GET /deeplink", () => {
    it("rejects a target outside the allowlist", async () => {
      const res = await request(app).get("/deeplink?to=evil.com");
      expect(res.status).toBe(400);
    });

    it("redirects an allowed target and URL-encodes the token", async () => {
      const res = await request(app)
        .get("/deeplink")
        .query({ to: "update-password", token: "a b/c" });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("https://app.test/update-password?token=a%20b%2Fc");
    });
  });
});
