// routes/user.route.ts
import express from "express";
import multer from "multer";

import {UserController} from "../controllers";
import apiKeyAuth from "../middleware/apiKeyAuth";
import mobileKeyAuth from "../middleware/mobileKeyAuth";
import { requireAuth } from "../middleware/auth.middleware";


const router = express.Router();
const upload = multer();

// Password flows
router.post('/reset-password', UserController.resetPassword);
router.put('/update-password',requireAuth,UserController.updatePassword);

// Device tokens
router.post('/device-token', UserController.addDeviceToken);
router.delete('/device-token', UserController.deleteDeviceToken);

// User image upload
router.post('/:id/image', upload.single('image'), UserController.uploadImageFile);

// User management
router.get('/', mobileKeyAuth, UserController.findAll);
router.get('/owner/:ownerId', mobileKeyAuth, UserController.findAllByOwner);
router.get('/owners', apiKeyAuth, UserController.findAllOwners);
router.put('/:id', mobileKeyAuth, UserController.updateUserById);
router.delete('/:id', mobileKeyAuth, UserController.deleteUserById);
router.get('/id', apiKeyAuth, UserController.getUserIdByEmail);

export default router;
