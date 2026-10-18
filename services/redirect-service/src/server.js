import app from "./app.js";
import connectDB from "./config/db.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";

const PORT = process.env.PORT || 3003;
const SERVICE_NAME = process.env.SERVICE_NAME || "redirect-service";

const startServer = async () => {
    try {
        await connectDB();

        try {
            await connectRedis();
        } catch (redisError) {
            console.warn("Redis connection failed, running without cache:", redisError.message);
        }
        app.listen(PORT, () => {
            console.log(`${SERVICE_NAME} is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

process.on("SIGTERM", async () => {
    await disconnectRedis();
    process.exit(0);
});

startServer();
