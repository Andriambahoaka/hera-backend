import express from 'express';
import * as activityCtrl from './activity.controller';
import { requireAuth } from '../auth/auth.middleware';

const router = express.Router();

router.post('/', activityCtrl.addActivity);
router.get('/', requireAuth,activityCtrl.findActivitiesByDate);

export default router;
