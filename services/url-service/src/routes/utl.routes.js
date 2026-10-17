import { Router } from "express";

import { authenticateToken } from "../middlewares/auth.middleware.js";
import urlController from "../controllers/url.controller.js";

const router = Router();

router.route("/")
    .get((req, res) => {
        res.send("hello")
    })
    .post(authenticateToken, urlController.createShortUrl);

export default router;