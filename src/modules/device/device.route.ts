import { Router } from 'express';
import * as deviceController from './device.controller';
import { clientAuth } from '../../core/middleware/clientAuth.middleware';
import { userAuth } from '../auth/auth.middleware';
import { adminMiddleware } from '../../core/middleware/adminKey.middleware';
import { requireDeviceAccess } from './device.access';
import { AccessLevel } from './deviceAccess.model';

const router = Router();

router.post('/', clientAuth, deviceController.add);
router.get('/', clientAuth, deviceController.findAll);

router.get('/owner', userAuth, deviceController.findAllByOwner);

router.get('/granted-access', userAuth, deviceController.findGrantedAccess);

router.post('/access', userAuth, deviceController.setMultipleAccess);

router.put('/', userAuth, requireDeviceAccess(AccessLevel.ADMIN), deviceController.update);

// Level 1 (Basic): arm/disarm, alarm state, instant capture, accessory info/status.
router.post('/set-area-arm', userAuth, requireDeviceAccess(AccessLevel.BASIC), deviceController.setAreaArmMode);
router.post('/get-area-arm', userAuth, requireDeviceAccess(AccessLevel.BASIC), deviceController.getAreaArmMode);

router.post('/add-accessory', clientAuth, deviceController.addAccessory);
router.post('/get-accessories-info', userAuth, requireDeviceAccess(AccessLevel.BASIC), deviceController.getAccessoriesInfo);
router.post('/get-accessory-status', userAuth, requireDeviceAccess(AccessLevel.BASIC), deviceController.getAccessoryStatus);
// Level 3 (Admin): settings.
router.put('/set-accessory', userAuth, requireDeviceAccess(AccessLevel.ADMIN), deviceController.setAccessory);

router.post('/get-screenshot-url', userAuth, requireDeviceAccess(AccessLevel.BASIC), deviceController.getPirCamSnapUrl);

router.get('/access/:userId', userAuth, deviceController.findAccessibleDevices);

router.get('/:deviceId', userAuth, requireDeviceAccess(AccessLevel.BASIC), deviceController.findByDeviceId);
router.delete('/:deviceId', adminMiddleware, deviceController.deleteDevice);

export default router;
