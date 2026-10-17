import { Router } from "express"
import { redirectToOriginalUrl } from "../controllers/redirect.controller.js";

const router = Router();

router.route("/:shortCode").get(redirectToOriginalUrl);

export default router;
