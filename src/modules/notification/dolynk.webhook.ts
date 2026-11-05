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

export function isValidDolynkSignature(body: unknown, secret: string | undefined): boolean {
  if (!secret || !body || typeof body !== "object") return false;
  const { id, sign } = body as { id?: unknown; sign?: unknown };

  if ((typeof id !== "string" && typeof id !== "number") || String(id) === "") return false;
  if (typeof sign !== "string" || !/^[0-9a-f]{128}$/i.test(sign)) return false;

  const expected = Buffer.from(computeDolynkSignature(String(id), secret), "hex");
  const received = Buffer.from(sign, "hex");
  return crypto.timingSafeEqual(expected, received);
}

export const verifyDolynkSignature = (req: Request, _res: Response, next: NextFunction) => {
  if (!isValidDolynkSignature(req.body, process.env.DOLYNK_SECRET_ACCESS_KEY)) {
    throw new AppError(INVALID_SIGNATURE);
  }
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
  const eventId = String(body.id);
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
