import express from 'express';
import * as authController from './auth.controller';
import apiKeyAuth from '../../core/middleware/apiKeyAuth';

const router = express.Router();

router.post('/signup',apiKeyAuth,authController.signup);
router.post('/login',authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',authController.resetPassword);
router.post('/refresh', authController.refreshToken);

export default router;