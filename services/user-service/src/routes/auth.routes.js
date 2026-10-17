import express from "express";
import { registerController, loginController, logoutController, getMeController, refreshTokensController } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { registerSchema,loginSchema } from "../validators/auth.validator.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = express.Router();


router.route("/health").get((req, res) => {
    return res.json({
        message: "user-service auth router route is working fine",
        status: 200
    })
})
router.route("/register").post(validate(registerSchema),registerController);
router.route("/login").post(validate(loginSchema),loginController);
router.route("/logout").post(authenticate,logoutController);
router.route("/me").get(authenticate,getMeController);
router.route("/refresh-token").post(refreshTokensController);

export default router;
