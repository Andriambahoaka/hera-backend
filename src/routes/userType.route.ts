// routes/userType.routes.ts
import express from "express";
import * as userCtrl from "../modules/user/user.controller";

const router = express.Router();

router.post("/", userCtrl.addUserType);

export default router;
