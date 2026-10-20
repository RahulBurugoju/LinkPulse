import rateLimit from "express-rate-limit";
import env from "../config/env.js";

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      success: false,
      message: "Too many requests to API Gateway. Please slow down.",
      errors: null,
    });
  },
});

export default globalRateLimiter;
