import { Router } from 'express';
import * as deviceController from './device.controller';
import apiKeyAuth from '../../core/middleware/apikey.middleware';
import { requireAuth } from '../auth/auth.middleware';

const router = Router();

router.post('/', apiKeyAuth, deviceController.add);
router.get('/', apiKeyAuth, deviceController.findAll);

router.get('/owner',requireAuth, deviceController.findAllByOwner);

router.get('/granted-access', requireAuth, deviceController.findGrantedAccess);

router.post('/access', deviceController.addOrUpdateAccess);

router.put('/urgency-number', deviceController.editUrgencyNumber);
router.put('/', deviceController.update);
router.put('/names', deviceController.updateDeviceNames);

router.post('/set-area-arm', requireAuth, deviceController.setAreaArmMode);
router.post('/get-area-arm', requireAuth, deviceController.getAreaArmMode);

router.post('/get-accessories-info', requireAuth,deviceController.getAccessoriesInfo);
router.post('/get-accessory-status',requireAuth, deviceController.getAccessoryStatus);
router.put('/set-accessory', requireAuth, deviceController.setAccessory);

router.post('/get-screenshot-url', requireAuth, deviceController.getPirCamSnapUrl);

router.get('/access/:userId',deviceController.findAccessibleDevices);

router.get('/:deviceId', deviceController.findByDeviceId);

export default router;
