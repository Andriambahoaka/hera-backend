import express from 'express';
import * as authController from './auth.controller';
import adminApiKeyAuth from '../../core/middleware/adminApiKeyAuth';
import apiKeyAuth from '../../core/middleware/apiKeyAuth';

const router = express.Router();

router.post('/signup',apiKeyAuth,authController.signup);
router.post('/login',authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get("/generate-token",adminApiKeyAuth, authController.generateApiKey);
router.post("/refresh-token", authController.refreshApiKey);

export default router;