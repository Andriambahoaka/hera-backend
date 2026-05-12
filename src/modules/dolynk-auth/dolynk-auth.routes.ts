import { Router } from "express";
import { getDolynkClientHeaders } from "./dolynk-auth.controller";

const router = Router();

router.get("/client-headers", getDolynkClientHeaders);

export default router;