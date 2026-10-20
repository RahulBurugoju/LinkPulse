import logger from "../config/logger.js";

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal server error";

  (req.log || logger).error(
    {
      err: {
        type: err.name,
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      },
      path: req.originalUrl,
      method: req.method,
    },
    "Gateway error encountered"
  );

  return res.status(statusCode).json({
    success: false,
    message,
    errors: err.errors || null,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl} on API Gateway`,
    errors: null,
  });
};

export default { errorHandler, notFoundHandler };
