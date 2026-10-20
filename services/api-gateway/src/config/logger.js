import pino from "pino";
import env from "./env.js";

const logger = pino({
  level: env.LOG_LEVEL || "info",

  base: {
    service: env.SERVICE_NAME || "api-gateway",
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "password",
      "user.password",
      "token",
      "accessToken",
      "refreshToken",
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
    ],
    censor: "[REDACTED]",
  },
});

export default logger;
