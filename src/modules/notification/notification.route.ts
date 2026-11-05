import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as notificationCtrl from './notification.controller';
import { userAuth } from "../auth/auth.middleware";
import { receiveDolynkEvent, verifyDolynkSignature } from './dolynk.webhook';

const router = Router();

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Dolynk webhook: signed, see dolynk.webhook.ts.
router.post('/', webhookLimiter, verifyDolynkSignature, receiveDolynkEvent);
router.get('/', userAuth, notificationCtrl.findAllForUser);

export default router;
