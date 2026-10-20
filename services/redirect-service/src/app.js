import "dotenv/config"

import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors"
import { pinoHttp } from "pino-http";
import logger from "./config/logger.js";

import redirectRouter from "./routes/redirect.routes.js";
import errorHandler from "./middlewares/error.middleware.js";
import { redisClient } from "./config/redis.js";

const app = express();

app.use(
    pinoHttp({
        logger,

        customLogLevel(req, res, err) {
            if (err || res.statusCode >= 500) return "error";
            if (res.statusCode >= 400) return "warn";
            return "info";
        },
    })
);

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3003;
const SERVICE_NAME = process.env.SERVICE_NAME || "redirect-service";

const isMongoReady = () => mongoose.connection.readyState === 1;

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: process.env.SERVICE_NAME || "redirect-service",
    });
});

app.get("/ready", (req, res) => {
    const mongoReady = isMongoReady();
    const redisReady = Boolean(redisClient?.isReady);
    const ready = mongoReady; // MongoDB is required; Redis is optional

    res.status(ready ? 200 : 503).json({
        status: ready ? "ready" : "not_ready",
        service: process.env.SERVICE_NAME || "redirect-service",
        checks: {
            mongodb: mongoReady ? "up" : "down",
            redis: redisReady ? "up" : "degraded",
        },
        dependencies: {
            mongodb: mongoReady ? "connected" : "disconnected",
            redis: redisReady ? "connected" : "degraded",
        },
    });
});

app.use("/", redirectRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
