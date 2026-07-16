import { Router } from 'express';
import * as notificationCtrl from './notification.controller';
import { userAuth } from "../auth/auth.middleware";

const router = Router();

router.post('/',notificationCtrl.postNotification);
router.get('/',userAuth,notificationCtrl.findAllForUser);

export default router;

