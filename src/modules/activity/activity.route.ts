import express from 'express';
import * as activityCtrl from './activity.controller';
import { userAuth } from '../auth/auth.middleware';

const router = express.Router();

router.post('/', activityCtrl.addActivity);
router.get('/', userAuth, activityCtrl.findActivitiesByDate);

export default router;
