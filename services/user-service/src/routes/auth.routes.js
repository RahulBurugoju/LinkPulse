import express from "express";



const router = express.Router();


router.route("/health").get((req, res) => {
    return res.json({
        message: "user-service auth router route is working fine",
        status: 200
    })
})
// router.route("/register").post();
// router.route("/login").post();

export default router;
