import express from 'express';
import * as authController from '../controllers/auth.controller';
import adminApiKeyAuth from '../middleware/adminApiKeyAuth';
import apiKeyAuth from '../middleware/apiKeyAuth';

const router = express.Router();

router.post('/signup',apiKeyAuth,authController.signup);
router.post('/login',authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.get("/generate-token",adminApiKeyAuth, authController.generateApiKey);
router.post("/refresh-token", authController.refreshApiKey);

export default router;