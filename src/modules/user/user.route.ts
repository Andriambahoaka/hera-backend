
import express from "express";
import multer from "multer";

import * as UserController from "./user.controller";
import { clientAuth } from "../../core/middleware/clientAuth.middleware";
import mobileKeyAuth from "../../core/middleware/mobileKey.middleware";
import { userAuth } from "../auth/auth.middleware";
import { adminMiddleware } from "../../core/middleware/adminKey.middleware";


const router = express.Router();
const upload = multer();

router.get('/me', userAuth, UserController.getMe);

// Password 
router.post('/create-password', userAuth, UserController.createPassword);
router.put('/update-password', userAuth, UserController.updatePassword);

// Device tokens
router.post('/device-token', userAuth, UserController.addDeviceToken);
router.post('/logout', userAuth, UserController.logout);

// User image upload
router.post('/image', userAuth, upload.single('image'), UserController.uploadImageFile);

// Member management
router.post('/add-member', userAuth, UserController.addMember);
router.put('/update-member', userAuth, UserController.updateMember);
router.get('/members', userAuth, UserController.findAllMembers);

router.get('/', mobileKeyAuth, UserController.findAll);
router.get('/owners', clientAuth, UserController.findAllOwners);
router.delete('/:id', userAuth, UserController.deleteUserById);
router.get('/id', clientAuth, UserController.getUserIdByEmail);

router.delete('/admin/:id', adminMiddleware, UserController.deleteUserByAdmin);

export default router;
