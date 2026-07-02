import express from 'express';
import * as authController from './auth.controller';
import {clientAuth} from '../../core/middleware/clientAuth.middleware';


const router = express.Router();

router.post('/signup',clientAuth,authController.signup);
router.post('/login',authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',authController.resetPassword);
router.post('/refresh', authController.refreshToken);

export default router;