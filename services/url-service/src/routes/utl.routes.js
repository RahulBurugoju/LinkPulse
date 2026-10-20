import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import urlController from "../controllers/url.controller.js";

const router = Router();

router.route("/")
    .post(authenticateToken, urlController.createShortUrl);

router.route("/ownership/:shortCode")
    .get(authenticateToken, urlController.checkOwnership);

router.route("/:urlId")
    .get(authenticateToken, urlController.getUrl)
    .patch(authenticateToken, urlController.updateUrl)
    .delete(authenticateToken, urlController.deleteUrl);

export default router;