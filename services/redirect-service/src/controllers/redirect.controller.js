import { asyncHandler } from "../util/asyncHandler.js";
import { ApiResponse } from "../util/ApiResponse.js";
import { ApiError } from "../util/ApiError.js";
import redirectServices from "../services/redirect.services.js";
import { redisClient } from "../config/redis.js";

const SHORT_CODE_REGEX = /^[a-zA-Z0-9]{8}$/;
const CACHE_TTL_SECONDS = 60 * 60;

const redirectToOriginalUrl = asyncHandler(async (req, res) => {
    const { shortCode } = req.params;

    if (!SHORT_CODE_REGEX.test(shortCode)) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Invalid short code"));
    }

    const cacheKey = `url:${shortCode}`;

    // Check Redis cache
    let originalUrl = null;

    if (redisClient.isReady) {
        try {
            originalUrl = await redisClient.get(cacheKey);
        } catch (error) {
            console.error(`Redis cache miss for ${cacheKey}:`, error.message);
        }
    }

    if (!originalUrl) {
        originalUrl = await redirectServices.getOriginalUrl(shortCode);

        if (redisClient.isReady) {
            try {
                await redisClient.set(cacheKey, originalUrl, "EX", CACHE_TTL_SECONDS);
            } catch (error) {
                console.error("Redis write failed:", error.message);
            }
        }
    }

    // Defensive validation before redirecting
    let destination;
    try {
        destination = new URL(originalUrl);
    } catch {
        return res
            .status(500)
            .json(new ApiResponse(500, null, "Stored destination URL is invalid"));
    }

    if (!["http:", "https:"].includes(destination.protocol)) {
        return res
            .status(500)
            .json(new ApiResponse(500, null, "Stored destination URL is invalid"));
    }

    return res.redirect(302, destination.toString());
});

export { redirectToOriginalUrl };
