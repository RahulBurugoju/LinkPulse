import "./config/env.js";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors"
import { pinoHttp } from "pino-http";
import logger from "./config/logger.js";

import urlRouter from "./routes/utl.routes.js";
import errorHandler from "./middlewares/error.middleware.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

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

const PORT = process.env.PORT || 3002;
const SERVICE_NAME = process.env.SERVICE_NAME || "url-service";

const isMongoReady = () => mongoose.connection.readyState === 1;

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: process.env.SERVICE_NAME || "url-service",
    });
});

app.get("/ready", (req, res) => {
    const ready = isMongoReady();

    res.status(ready ? 200 : 503).json({
        status: ready ? "ready" : "not_ready",
        service: process.env.SERVICE_NAME || "url-service",
        checks: {
            mongodb: ready ? "up" : "down",
        },
        dependencies: {
            mongodb: ready ? "connected" : "disconnected",
        },
    });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});

app.use("/api/urls", urlRouter);
app.use("/api/v1/url", urlRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
