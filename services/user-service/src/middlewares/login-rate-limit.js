import rateLimit from "express-rate-limit";

const LoginRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: "Too many login attempts from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false
});

export default LoginRateLimit;