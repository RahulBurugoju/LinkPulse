import "dotenv/config"

import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors"

import urlRouter from "./routes/utl.routes.js";
import errorHandler from "./middlewares/error.middleware.js";

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3002;
const SERVICE_NAME = process.env.SERVICE_NAME;


app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: SERVICE_NAME,
        timestamp: new Date().toISOString()
    });
});

app.get("/ready", (req, res) => {
    const databaseReady = mongoose.connection.readyState === 1;

    res.status(databaseReady ? 200 : 503).json({
        status: databaseReady ? "ready" : "not_ready",
        service: SERVICE_NAME,
        dependencies: {
            mongodb: databaseReady ? "connected" : "disconnected"
        }
    });
});

app.use("/api/v1/url", urlRouter);

// Global Error Handler
app.use(errorHandler);

export default app;
