import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../../core/errors/app.error";
import { HTTP_STATUS } from "../../core/constants/httpStatus";
import { asyncHandler } from "../../core/utils/asyncHandler";
import Device from "../device/device.model";
import DolynkEvent from "./dolynkEvent.model";
import { NotificationService } from "./notification.service";
import { CreateNotificationDto } from "./notification.types";

/**
 * Dolynk webhook (POST /api/notifications).
 *
 * Signature (reverse-engineered from a real event, no public spec):
 *   sign = lowercase hex HMAC-SHA512(DOLYNK_SECRET_ACCESS_KEY, String(id))
 *
 * Only `id` is signed, so the other protections matter too:
 *   - each event id is processed at most once (DolynkEvent),
 *   - events older/newer than MAX_EVENT_AGE_MS are ignored,
 *   - only known fields are kept; `userId` and anything else is dropped,
 *   - the device must exist.
 *
 * Signed requests always get a minimal 200 (even when ignored), so Dolynk
 * does not retry events we deliberately skip. Reasons are logged server-side.
 */

export const MAX_EVENT_AGE_MS = 24 * 60 * 60 * 1000;

const ALLOWED_FIELDS = [
  "deviceId",
  "msgType",
  "category",
  "channelId",
  "utcTime",
  "localTime",
  "filePath",
  "alarmType",
  "accessKey",
  "productId",
] as const;

const INVALID_SIGNATURE = {
  code: "INVALID_WEBHOOK_SIGNATURE",
  status: HTTP_STATUS.UNAUTHORIZED,
  message: "Invalid signature.",
};

export function computeDolynkSignature(id: string, secret: string): string {
  return crypto.createHmac("sha512", secret).update(id).digest("hex");
}

/**
 * The event id exactly as Dolynk sent it. Ids are 19-digit numbers sent as JSON
 * numbers: JSON.parse rounds them (2120860749252259840 -> 2120860749252259800),
 * which breaks both the signature and deduplication. So the digits are read
 * from the raw body text when it is available.
 */
export function dolynkEventId(body: unknown, rawBody?: string): string | undefined {
  if (rawBody) {
    // Top-level "id" (preceded by "{" or ","), as a number or a string.
    const m = rawBody.match(/[{,]\s*"id"\s*:\s*(?:"([^"]*)"|(-?\d+))\s*[,}]/);
    if (m) return m[1] ?? m[2];
  }
  const id = (body as { id?: unknown } | undefined)?.id;
  if (typeof id === "string") return id;
  if (typeof id === "number" && Number.isSafeInteger(id)) return String(id);
  return undefined;
}

export function isValidDolynkSignature(
  id: string | undefined,
  sign: unknown,
  secret: string | undefined
): boolean {
  if (!secret || !id) return false;
  if (typeof sign !== "string" || !/^[0-9a-f]{128}$/i.test(sign)) return false;

  const expected = Buffer.from(computeDolynkSignature(id, secret), "hex");
  const received = Buffer.from(sign, "hex");
  return crypto.timingSafeEqual(expected, received);
}

export const verifyDolynkSignature = (req: Request, res: Response, next: NextFunction) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const id = dolynkEventId(body, req.rawBody);
  const valid = isValidDolynkSignature(id, body.sign, process.env.DOLYNK_SECRET_ACCESS_KEY);

  // TEMPORARY (Dolynk payload discovery): logs every incoming event, valid or not.
  // The sign is shortened; the secret is never logged. Remove once the format is confirmed.
  if (process.env.NODE_ENV !== "test") {
    const shown = { ...body, id, sign: typeof body.sign === "string" ? `${body.sign.slice(0, 12)}…` : body.sign };
    console.log(`[dolynk] incoming signatureValid=${valid} hasId=${id !== undefined}`, JSON.stringify(shown));
  }

  if (!valid) {
    throw new AppError(INVALID_SIGNATURE);
  }
  res.locals.dolynkEventId = id;
  next();
};

function pickAllowedFields(body: Record<string, unknown>) {
  const picked: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) picked[key] = body[key];
  }
  return picked;
}

function ignore(res: Response, eventId: string, reason: string) {
  console.warn(`Dolynk event ${eventId} ignored: ${reason}`);
  return res.status(200).json({ received: true });
}

export const receiveDolynkEvent = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Record<string, unknown>;
  // Exact id from verifyDolynkSignature (never the rounded body.id).
  const eventId = String(res.locals.dolynkEventId);
  const fields = pickAllowedFields(body);

  if (typeof fields.deviceId !== "string" || typeof fields.msgType !== "string") {
    return ignore(res, eventId, "missing deviceId or msgType");
  }

  const utcTime = Number(fields.utcTime);
  if (fields.utcTime !== undefined && (!Number.isFinite(utcTime) || Math.abs(Date.now() - utcTime) > MAX_EVENT_AGE_MS)) {
    return ignore(res, eventId, "utcTime outside the accepted window");
  }

  if (
    body.accessKey !== process.env.DOLYNK_ACCESS_KEY ||
    body.productId !== process.env.DOLYNK_PRODUCT_ID
  ) {
    // Not rejected yet: the only sample received (a console test push) had
    // values different from ours. Logged so real events can confirm it.
    console.warn(`Dolynk event ${eventId}: accessKey/productId differ from configuration`);
  }

  try {
    await DolynkEvent.create({ _id: eventId });
  } catch (err: any) {
    if (err?.code === 11000) return ignore(res, eventId, "duplicate event id");
    throw err;
  }

  if (!(await Device.exists({ deviceId: fields.deviceId }))) {
    return ignore(res, eventId, "unknown deviceId");
  }

  try {
    await NotificationService.createAndSend(fields as CreateNotificationDto);
  } catch (err) {
    // Forget the id so a Dolynk retry can be processed.
    await DolynkEvent.deleteOne({ _id: eventId }).catch(() => undefined);
    throw err;
  }

  return res.status(200).json({ received: true });
});
