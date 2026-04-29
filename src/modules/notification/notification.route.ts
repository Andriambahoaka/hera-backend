import { Router } from 'express';
import * as notificationCtrl from '../controllers/notification.controller';

const router = Router();

router.post('/', notificationCtrl.postNotification);
router.get('/owner/:ownerId', notificationCtrl.findAllByOwner);

export default router;

