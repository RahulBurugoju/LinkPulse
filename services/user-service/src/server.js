import "./config/env.js";
import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./config/logger.js";

const PORT = process.env.PORT || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME || "user-service";

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info({ port: PORT, serviceName: SERVICE_NAME }, "User Service started");
    });
  } catch (err) {
    logger.error({ err }, "User Service startup failed");
    process.exit(1);
  }
};

startServer();
