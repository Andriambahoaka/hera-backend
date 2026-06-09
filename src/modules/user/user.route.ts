
import express from "express";
import multer from "multer";

import * as UserController from "./user.controller";
import apiKeyAuth from "../../core/middleware/apikey.middleware";
import mobileKeyAuth from "../../core/middleware/mobileKey.middleware";
import { requireAuth } from "../auth/auth.middleware";


const router = express.Router();
const upload = multer();

router.get('/me', requireAuth, UserController.getMe);

// Password 
router.post('/create-password', requireAuth, UserController.createPassword);
router.put('/update-password', requireAuth, UserController.updatePassword);

// Device tokens
router.post('/device-token', requireAuth, UserController.addDeviceToken);
router.delete('/device-token', requireAuth, UserController.deleteDeviceToken);

// User image upload
router.post('/:id/image', requireAuth, upload.single('image'), UserController.uploadImageFile);

// User management
router.post('/add-member', requireAuth, UserController.addMember);

router.get('/', mobileKeyAuth, UserController.findAll);
router.get('/owner', requireAuth, UserController.findAllByOwner);
router.get('/owners', apiKeyAuth, UserController.findAllOwners);
router.put('/:id', mobileKeyAuth, UserController.updateUserById);
router.delete('/:id', mobileKeyAuth, UserController.deleteUserById);
router.get('/id', apiKeyAuth, UserController.getUserIdByEmail);

export default router;
