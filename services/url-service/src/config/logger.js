import pino from "pino";

const logger = pino({
    level: process.env.LOG_LEVEL || "info",

    base: {
        service: process.env.SERVICE_NAME || "url-service",
    },

    timestamp: pino.stdTimeFunctions.isoTime,

    redact: {
        paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            'res.headers["set-cookie"]',
            "req.body.password",
            "req.body.passwordHash",
            "req.body.refreshToken",
        ],
        censor: "[REDACTED]",
    },
});

export default logger;
