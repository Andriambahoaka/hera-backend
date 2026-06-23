
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
router.post('/logout', requireAuth, UserController.logout);

// User image upload
router.post('/image', requireAuth, upload.single('image'), UserController.uploadImageFile);

// Member management
router.post('/add-member', requireAuth, UserController.addMember);
router.put('/update-member', requireAuth, UserController.updateMember);
router.get('/members', requireAuth, UserController.findAllMembers);

router.get('/', mobileKeyAuth, UserController.findAll);
router.get('/owners', apiKeyAuth, UserController.findAllOwners);
router.delete('/:id',requireAuth, UserController.deleteUserById);
router.get('/id', apiKeyAuth, UserController.getUserIdByEmail);

export default router;
