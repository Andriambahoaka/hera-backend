import fs from "fs";
import path from "path";
import request from "supertest";
import app, { redactUrl } from "../../src/app";

const AASA_PATH = path.join(__dirname, "../../public/.well-known/apple-app-site-association");

describe("App Links / Universal Links", () => {
  it("serves assetlinks.json as JSON for the Android package", async () => {
    const res = await request(app).get("/.well-known/assetlinks.json");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/^application\/json/);
    expect(res.body[0]).toMatchObject({
      relation: ["delegate_permission/common.handle_all_urls"],
      target: { namespace: "android_app", package_name: "fr.securis.hera" },
    });
    expect(res.body[0].target.sha256_cert_fingerprints.length).toBeGreaterThan(0);
  });

  it("serves apple-app-site-association as JSON without redirect (404 until the file is added)", async () => {
    const res = await request(app).get("/.well-known/apple-app-site-association");

    if (!fs.existsSync(AASA_PATH)) {
      expect(res.status).toBe(404);
      return;
    }
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/^application\/json/);
    const details = res.body.applinks.details;
    expect(details.length).toBeGreaterThan(0);
    for (const d of details) {
      for (const id of d.appIDs ?? [d.appID]) expect(id).toMatch(/^[A-Z0-9]{10}\.fr\.securis\.hera$/);
    }
  });

  it("GET /update-password (browser fallback) never echoes the token and is not cached", async () => {
    const res = await request(app).get("/update-password?token=super-secret-token");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/^text\/html/);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.headers["referrer-policy"]).toBe("no-referrer");
    expect(res.text).not.toContain("super-secret-token");
  });
});

describe("public assets", () => {
  it("serves the email logo, loadable from other origins (webmail)", async () => {
    const res = await request(app).get("/public/logo.png");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("image/png");
    expect(res.headers["cross-origin-resource-policy"]).toBe("cross-origin");
  });

  it("does not expose dotfiles through /public", async () => {
    const res = await request(app).get("/public/.well-known/assetlinks.json");
    expect(res.status).toBe(404);
  });
});

describe("access log redaction", () => {
  it.each([
    ["/update-password?token=abc.def", "/update-password?token=[REDACTED]"],
    ["/deeplink?to=update-password&token=abc", "/deeplink?to=update-password&token=[REDACTED]"],
    ["/api/packs?deviceId=1", "/api/packs?deviceId=1"],
  ])("%s", (url, expected) => {
    expect(redactUrl(url)).toBe(expected);
  });
});
