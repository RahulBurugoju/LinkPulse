import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./config/logger.js";

const PORT = process.env.PORT || 3002;
const SERVICE_NAME = process.env.SERVICE_NAME || "url-service";

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            logger.info({ port: PORT, serviceName: SERVICE_NAME }, "URL Service started");
        });
    } catch (error) {
        logger.error({ err: error }, "Failed to start server");
        process.exit(1);
    }
};

startServer();
