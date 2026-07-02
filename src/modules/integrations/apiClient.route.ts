import express from "express";
import * as apiKeyController from "./apiClient.controller";
import adminApiKeyAuth from "../../core/middleware/adminKey.middleware";
const router = express.Router();

router.post("/", adminApiKeyAuth, apiKeyController.createApiClient);
router.post("/token", apiKeyController.clientToken);

export default router;