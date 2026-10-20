import app from "./app.js";
import env from "./config/env.js";
import logger from "./config/logger.js";

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      service: env.SERVICE_NAME,
      env: env.NODE_ENV,
    },
    `API Gateway running on http://localhost:${env.PORT}`
  );
});

function gracefulShutdown(signal) {
  logger.info({ signal }, "Received termination signal, shutting down API Gateway gracefully");

  server.close(() => {
    logger.info("API Gateway HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("uncaughtException", (err) => {
  logger.fatal({ err: err.message, stack: err.stack }, "Uncaught Exception in API Gateway");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled Rejection in API Gateway");
  process.exit(1);
});
