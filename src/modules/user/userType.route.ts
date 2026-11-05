// routes/userType.routes.ts
import express from "express";
import * as userCtrl from "./user.controller";
import { adminMiddleware } from "../../core/middleware/adminKey.middleware";

const router = express.Router();

router.post("/", adminMiddleware, userCtrl.addUserType);

export default router;
