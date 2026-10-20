import { ApiError } from "../util/ApiError.js";
import logger from "../config/logger.js";

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    // If it's already an ApiError, use its values directly
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            message: err.message,
            error: err.message,
            errors: err.errors,
            ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
        });
    }

    // Mongoose validation error
    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
        }));

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        return res.status(409).json({
            success: false,
            message: `${field} already exists`,
            errors: null,
        });
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
            errors: null,
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Token has expired",
            errors: null,
        });
    }

    // Fallback for unexpected errors
    (req.log || logger).error(
        { err: { type: err.name, message: err.message, stack: err.stack } },
        "Unhandled error"
    );

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        errors: null,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

export default errorHandler;
