import jwt from "jsonwebtoken";
import { asyncHandler } from "../util/asyncHandler.js";
import { ApiError } from "../util/ApiError.js";

export const authenticate = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const accessToken = req.cookies?.accessToken || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

    if (!accessToken) {
        throw new ApiError(401, "Unauthorized request : access token required");
    }

    const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
    if (!secret) {
        console.error("JWT_SECRET is not configured");
        throw new ApiError(500, "Internal server error");
    }

    let decodedToken;
    try {
        const verifyOptions = {};
        if (process.env.JWT_ISSUER) verifyOptions.issuer = process.env.JWT_ISSUER;
        if (process.env.JWT_AUDIENCE) verifyOptions.audience = process.env.JWT_AUDIENCE;

        decodedToken = jwt.verify(accessToken, secret, verifyOptions);
    } catch {
        throw new ApiError(401, "Invalid or expired token");
    }

    const userId = decodedToken?.sub || decodedToken?.userId;
    if (!userId) {
        throw new ApiError(401, "Invalid access token");
    }

    req.user = {
        Id: userId,
        id: userId,
        sub: userId,
        name: decodedToken?.name,
        email: decodedToken?.email,
    };

    next();
});

export const authenticateToken = authenticate;
export default authenticate;
