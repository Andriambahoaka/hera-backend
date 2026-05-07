import express from 'express';
import * as activityCtrl from './activity.controller';

const router = express.Router();

router.post('/', activityCtrl.addActivity);
router.get('/byDate', activityCtrl.findActivitiesByDate);

export default router;
