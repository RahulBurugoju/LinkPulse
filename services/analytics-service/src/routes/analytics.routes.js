import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { getUrlAnalytics } from "../controllers/analytics.controller.js";

const router = Router();

router.route("/:shortCode").get(authenticateToken, getUrlAnalytics);

export default router;
