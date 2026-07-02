import { Router } from 'express';
import * as deviceController from './device.controller';
import { clientAuth } from '../../core/middleware/clientAuth.middleware';
import { userAuth } from '../auth/auth.middleware';

const router = Router();

router.post('/', clientAuth, deviceController.add);
router.get('/', clientAuth, deviceController.findAll);

router.get('/owner', userAuth, deviceController.findAllByOwner);

router.get('/granted-access', userAuth, deviceController.findGrantedAccess);

router.post('/access', deviceController.addOrUpdateAccess);

router.put('/', deviceController.update);

router.post('/set-area-arm', userAuth, deviceController.setAreaArmMode);
router.post('/get-area-arm', userAuth, deviceController.getAreaArmMode);

router.post('/add-accessory', clientAuth, deviceController.addAccessory);
router.post('/get-accessories-info', userAuth, deviceController.getAccessoriesInfo);
router.post('/get-accessory-status', userAuth, deviceController.getAccessoryStatus);
router.put('/set-accessory', userAuth, deviceController.setAccessory);

router.post('/get-screenshot-url', userAuth, deviceController.getPirCamSnapUrl);

router.get('/access/:userId', deviceController.findAccessibleDevices);

router.get('/:deviceId', deviceController.findByDeviceId);

export default router;
