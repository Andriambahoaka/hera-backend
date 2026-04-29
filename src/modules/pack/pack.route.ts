import { Router } from 'express';
import * as packCtrl from '../controllers/pack.controller';
import apiKeyAuth from '../../core/middleware/apiKeyAuth';

const router = Router();

router.post('/', apiKeyAuth, packCtrl.addPack);
router.get('/', apiKeyAuth, packCtrl.findAll);
router.get('/owner/:ownerId', packCtrl.findAllByOwner);
router.get('/:deviceId', packCtrl.findByDeviceId);
router.post('/access', packCtrl.addOrUpdatePackAccess);
router.get('/access/:userId', packCtrl.findAllPackAccessByUser);
router.put('/urgency-number', packCtrl.editUrgencyNumber);
router.put('/', packCtrl.update);
router.put('/names', packCtrl.updateDeviceNames);

export default router;
