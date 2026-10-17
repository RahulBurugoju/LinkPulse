import { Router } from "express"

const router = Router();

// router.route("/:shortCode").get(handleRedirect);
router.route("/shortCode").get((req, res) => {
    res.send("Hello World Redirected Service is live");
});

export default router
