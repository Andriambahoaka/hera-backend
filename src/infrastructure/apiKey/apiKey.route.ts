import express from "express";
import * as apiKeyController from "./apiKey.controller";
import adminApiKeyAuth from "../../core/middleware/adminKey.middleware";
const router = express.Router();

router.post("/", adminApiKeyAuth, apiKeyController.generateApiKey);
router.post("/refresh", apiKeyController.refreshApiKey);

export default router;