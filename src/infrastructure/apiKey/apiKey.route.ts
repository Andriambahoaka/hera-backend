import express from "express";
import * as apiKeyController from "./apiKey.controller";
import adminApiKeyAuth from "../../core/middleware/adminApiKeyAuth";
const router = express.Router();

router.post("/api-keys", adminApiKeyAuth, apiKeyController.generateApiKey);
router.post("/api-keys/refresh", apiKeyController.refreshApiKey);

export default router;