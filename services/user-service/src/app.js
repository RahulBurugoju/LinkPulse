import "dotenv/config"

import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors"

import authRouter from "./routes/auth.routes.js"

const app = express()

app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const PORT = process.env.PORT || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME


app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: SERVICE_NAME,
        timestamp: new Date().toISOString()
    });
})

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

app.use("/api/auth", authRouter);

export default app
