import { Router } from 'express';
import * as notificationCtrl from './notification.controller';
import { requireAuth } from "../auth/auth.middleware";

const router = Router();

router.post('/',notificationCtrl.postNotification);
router.get('/',requireAuth,notificationCtrl.findAllByOwner);

export default router;

