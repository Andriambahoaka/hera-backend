import { Router } from 'express';
import * as deviceController from './device.controller';
import apiKeyAuth from '../../core/middleware/apikey.middleware';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.post('/', apiKeyAuth, deviceController.add);
router.get('/', apiKeyAuth, deviceController.findAll);
router.get('/owner/:ownerId', deviceController.findAllByOwner);
router.get('/:deviceId', deviceController.findByDeviceId);
router.post('/access', deviceController.addOrUpdateAccess);
router.get('/access/:userId', deviceController.findAllAccessByUser);
router.put('/urgency-number', deviceController.editUrgencyNumber);
router.put('/', deviceController.update);
router.put('/names', deviceController.updateDeviceNames);

router.post('/set-area-arm', requireAuth,deviceController.setAreaArmMode);
router.post('/get-area-arm', deviceController.getAreaArmMode);

export default router;
