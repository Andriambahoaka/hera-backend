# Runbook: ship `global-refactor` to production

**Goal:** merge `global-refactor` into `main` and deploy it on the production server
(`hera.sate-telesurveillance.fr`, Docker Compose) without breaking the mobile app,
the alarms or the data.

**Downtime:** about 1–2 minutes (containers restart once, during step 5).
**Order matters:** do not skip step 1. Steps 2–4 change nothing in production.

What this release changes, in short:

| Area | Change | Production risk if unprepared |
|---|---|---|
| MongoDB | Auth on, no public port, replica set | API never starts (existing volume has no users) |
| Config | Startup refuses missing / weak env vars | API exits at boot |
| Dolynk webhook | Signature required, events deduplicated | Real alarms rejected (401) if the signature rule is wrong |
| Emails | Brevo API used when `BREVO_API_KEY` is set | Emails fail if that key is not enabled |
| API responses | 403 `{code, message}` on denied access; `password`, `devCode`, `devicesToken` never returned; some unauthenticated endpoints closed | Older app versions may break |
| Deep links | AASA + `assetlinks.json` served, reset link = `/update-password?token=…` | None (old `/deeplink` links still redirect) |

---

## 1. Validate on pre-production first (gates)

Pre-production: `https://hera-backend-28na.onrender.com` (Render, branch `global-refactor`).
Every box must be checked before going further.

- [ ] **Real Dolynk alarms.** Point Dolynk at pre-production (or wait for real events) and
      trigger an alarm. In the Render logs, `POST /api/notifications` must answer **200**, never
      401, and the notification must reach the phones. If you see 401 on real events, **stop**:
      the signature rule (`HMAC-SHA512(secret, id)`) does not cover them.
- [ ] **Emails.** Add a member (welcome email) and run forgot-password (reset email).
      Both must arrive. No `[email] … send failed` line in the logs.
- [ ] **Deep links.** Tapping the reset link in a received email opens the app on
      **Android and iOS**, and the password change succeeds.
- [ ] **Current store app.** With the app version that is live in the stores today:
      login, arm/disarm, notifications, member management. Anything that breaks must be
      fixed (or the new app published) before the backend goes live.
- [ ] The temporary `[dolynk] incoming` log in `dolynk.webhook.ts` is removed (it prints
      clip URLs that give access to the client's recordings).
- [ ] `npm test` passes on the commit you are about to ship.

## 2. Record the rollback point

On the server, in the folder containing `docker-compose.yml`:

```bash
git rev-parse HEAD > ~/rollback-commit.txt      # commit currently running
cat ~/rollback-commit.txt
cp .env ~/env.before-go-live                     # copy of the current config (keep it on the server)
chmod 600 ~/env.before-go-live
```

## 3. Prepare the production `.env`

The new API **refuses to start in production** if one of these is wrong. Check each one
in the server's `.env` (look at it in an editor; do not paste values into chats or tickets).

| Variable | Requirement |
|---|---|
| `MONGO_URI`, `JWT_SECRET`, `RESET_PASSWORD_SECRET`, `MASTER_ADMIN_KEY`, `MOBILE_API_KEY` | Set |
| `JWT_SECRET`, `RESET_PASSWORD_SECRET`, `MASTER_ADMIN_KEY` | **At least 32 characters** |
| `APP_DOMAIN` | `https://hera.sate-telesurveillance.fr` (used in reset emails and deep links) |
| `FIREBASE_*`, `CLOUDINARY_*`, `DOLYNK_*`, `BREVO_EMAIL_SENDER` | Set |
| Brevo | `BREVO_API_KEY` **or** both `BREVO_SMTP_USERNAME` and `BREVO_SMTP_PASSWORD` |

Points needing a decision:

- **Short `JWT_SECRET`:** replacing it logs **every user out** (their tokens become invalid).
  Acceptable once, at go-live; tell the client beforehand.
- **Short `MASTER_ADMIN_KEY`:** whoever uses it must receive the new value.
- **`BREVO_API_KEY`:** if it is set, emails go through the Brevo API. Keep it only if the key is
  enabled in Brevo (pre-production proved it works). Otherwise **remove the line** so production
  keeps using SMTP, which is not blocked on this server.
- `MONGO_URI` is changed in step 4, not here.

Generate new secrets with `openssl rand -hex 32`.

The automatic check runs in step 5 (it prints only variable names, never values).

## 4. Harden MongoDB

Follow [mongo-hardening.md](./mongo-hardening.md), **steps 0 to 5 only**
(check exposure, check for compromise, **backup**, create users, write `.env.mongo` and the new
`MONGO_URI`). Its step 6 is replaced by step 5 below.

Do not continue without a non-empty backup copied off the server.

## 5. Merge and deploy

On your machine:

```bash
git checkout main
git pull
git merge --ff-only global-refactor     # main has no commits of its own: fast-forward
git push origin main
```

On the server:

```bash
git checkout main
git pull

# Build the new image without touching the running containers.
docker compose build api

# Check the .env with the new rules (prints variable names only).
docker compose run --rm --no-deps --entrypoint node api -e '
  const { validateEnv } = require("./dist/core/config/env");
  const r = validateEnv(process.env);
  r.warnings.forEach((w) => console.log("WARN ", w));
  r.errors.forEach((e) => console.log("ERROR", e));
  console.log(r.errors.length ? "NOT READY" : "READY");'
```

Fix every `ERROR` in `.env` and run the check again until it prints `READY`.
`WARN` lines do not block (for example identical JWT/reset secrets, empty `CORS_ORIGINS`).

Then switch over:

```bash
docker compose up -d
```

Compose restarts `mongo` with auth and the replica set (initialised by its healthcheck, ~30 s),
then starts the API once `mongo` is healthy.

## 6. Verify

On the server:

```bash
docker compose ps                                   # api and mongo "healthy"
docker logs backend_api --tail 20                   # "Successfully connected to MongoDB!", no [CONFIG] Error
curl -s http://127.0.0.1:3000/healthz               # OK
```

From anywhere:

```bash
curl -si https://hera.sate-telesurveillance.fr/.well-known/apple-app-site-association | head -5
curl -si https://hera.sate-telesurveillance.fr/.well-known/assetlinks.json | head -5
# both: 200, application/json, no redirect
nc -vz <server-ip> 27017                            # must FAIL (database no longer public)
```

In the mobile app:

- [ ] Log in (everyone must log in again if `JWT_SECRET` changed).
- [ ] Arm / disarm, read the arm state, instant capture.
- [ ] Trigger a real alarm: the push arrives, and the server log shows `POST /api/notifications 200`.
- [ ] Forgot-password: email arrives, link opens the app, new password works.
- [ ] Add a member: welcome email arrives.

Apple caches the AASA on its CDN; iOS links on the production domain can take up to a day to
work. Check with:

```bash
curl -s https://app-site-association.cdn-apple.com/a/v1/hera.sate-telesurveillance.fr
```

## Rollback

**Code only** (database untouched, users from step 4 are harmless to the old code):

```bash
git checkout "$(cat ~/rollback-commit.txt)"
cp ~/env.before-go-live .env
docker compose up -d --build
```

The old `docker-compose.yml` starts MongoDB without auth again, and the old `MONGO_URI` in the
restored `.env` connects without credentials. If the old `MONGO_URI` already contained
credentials, keep the new one instead.

**Data damaged:** restore the backup as described in
[mongo-hardening.md › Rollback](./mongo-hardening.md#rollback).

## After go-live

- Delete `~/env.before-go-live` once production has been stable for a few days
  (it contains the old secrets).
- `assetlinks.json` must keep only the **release / Play App Signing** fingerprint.
- The webhook logs `accessKey/productId differ from configuration` when an event does not match;
  if real events never trigger it, those fields can become a hard check.
