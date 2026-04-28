
import express from "express";
import multer from "multer";

import * as UserController from "./user.controller";
import apiKeyAuth from "../../core/middleware/apiKeyAuth";
import mobileKeyAuth from "../../core/middleware/mobileKeyAuth";
import { requireAuth } from "../auth/auth.middleware";


const router = express.Router();
const upload = multer();

router.get('/me', requireAuth, UserController.getMe);

// Password 
router.put('/update-password', requireAuth, UserController.updatePassword);

// Device tokens
router.post('/device-token', requireAuth, UserController.addDeviceToken);
router.delete('/device-token', requireAuth, UserController.deleteDeviceToken);

// User image upload
router.post('/:id/image', requireAuth, upload.single('image'), UserController.uploadImageFile);

// User management
router.get('/', mobileKeyAuth, UserController.findAll);
router.get('/owner/:ownerId', mobileKeyAuth, UserController.findAllByOwner);
router.get('/owners', apiKeyAuth, UserController.findAllOwners);
router.put('/:id', mobileKeyAuth, UserController.updateUserById);
router.delete('/:id', mobileKeyAuth, UserController.deleteUserById);
router.get('/id', apiKeyAuth, UserController.getUserIdByEmail);

export default router;
