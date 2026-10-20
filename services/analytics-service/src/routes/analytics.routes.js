import { Router } from "express";
import { getUrlAnalytics } from "../controllers/analytics.controller.js";

const router = Router();

router.route("/:shortCode").get(getUrlAnalytics);

export default router;
