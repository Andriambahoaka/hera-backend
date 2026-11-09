import path from "path";
import { Request, Response, Router } from "express";

/**
 * Universal Links (iOS) / App Links (Android).
 *
 * Emails link directly to https://<APP_DOMAIN>/update-password?token=...
 *   - app installed + domain verified -> the OS opens the app with that URL;
 *   - otherwise the browser loads GET /update-password -> fallback page.
 *
 * The OS verifies the domain by fetching, over HTTPS, without redirects:
 *   /.well-known/apple-app-site-association  (iOS, no extension, JSON)
 *   /.well-known/assetlinks.json             (Android)
 * Both live in public/.well-known/ (express.static ignores dotfiles, hence
 * explicit routes).
 */

const PUBLIC_DIR = path.join(__dirname, "../../../public");
const WELL_KNOWN_DIR = path.join(PUBLIC_DIR, ".well-known");

const router = Router();

const sendWellKnown = (file: string) => (_req: Request, res: Response) => {
  res.type("application/json");
  res.set("Cache-Control", "public, max-age=3600");
  res.sendFile(path.join(WELL_KNOWN_DIR, file), (err) => {
    if (err && !res.headersSent) res.status(404).json({ code: "NOT_FOUND", message: "Not found" });
  });
};

router.get("/.well-known/apple-app-site-association", sendWellKnown("apple-app-site-association"));
router.get("/.well-known/assetlinks.json", sendWellKnown("assetlinks.json"));

// Fallback when the link opens in a browser instead of the app.
// The page never echoes the token; no-store + no-referrer keep it out of
// caches and out of Referer headers.
router.get("/update-password", (_req: Request, res: Response) => {
  res.set("Cache-Control", "no-store");
  res.set("Referrer-Policy", "no-referrer");
  res.sendFile(path.join(PUBLIC_DIR, "update-password.html"));
});

// Legacy link format, kept so reset emails sent before the switch keep working.
const DEEPLINK_ALLOWED = new Set(["update-password"]);

router.get("/deeplink", (req: Request, res: Response) => {
  const { to, token } = req.query as { to?: string; token?: string };

  if (!to || !DEEPLINK_ALLOWED.has(to)) {
    return res.status(400).send('Paramètre "to" invalide.');
  }

  const { APP_DOMAIN } = process.env;
  const deepLink = token
    ? `${APP_DOMAIN}/${to}?token=${encodeURIComponent(token)}`
    : `${APP_DOMAIN}/${to}`;

  // Not logged: the URL carries the password-reset token.
  res.redirect(deepLink);
});

export default router;
