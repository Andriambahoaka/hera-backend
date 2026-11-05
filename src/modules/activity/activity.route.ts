import express from 'express';
import * as activityCtrl from './activity.controller';
import { userAuth } from '../auth/auth.middleware';

const router = express.Router();

router.get('/', userAuth, activityCtrl.findActivitiesByDate);

export default router;
