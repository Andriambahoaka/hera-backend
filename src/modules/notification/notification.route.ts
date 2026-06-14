import { Router } from 'express';
import * as notificationCtrl from './notification.controller';

const router = Router();

router.post('/', notificationCtrl.postNotification);
router.get('/owner/:ownerId', notificationCtrl.findAllByOwner);

export default router;

