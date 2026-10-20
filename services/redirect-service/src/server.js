import app from "./app.js";
import connectDB from "./config/db.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import logger from "./config/logger.js";

const PORT = process.env.PORT || 3003;
const SERVICE_NAME = process.env.SERVICE_NAME || "redirect-service";

const startServer = async () => {
    try {
        await connectDB();

        try {
            await connectRedis();
        } catch (redisError) {
            logger.warn({ err: redisError.message }, "Redis connection failed, running without cache");
        }
        app.listen(PORT, () => {
            logger.info({ port: PORT, serviceName: SERVICE_NAME }, "Redirect Service started");
        });
    } catch (error) {
        logger.error({ err: error }, "Failed to start server");
        process.exit(1);
    }
};

process.on("SIGTERM", async () => {
    await disconnectRedis();
    process.exit(0);
});

startServer();
