import RedirectUrl from "../models/redirectUrl.model.js";
import { ApiError } from "../util/ApiError.js";
import logger from "../config/logger.js";

/**
 * Looks up the original URL for a given shortCode.
 * Throws ApiError on validation failure, not-found, or DB error.
 */
const getOriginalUrl = async (shortCode) => {
    const url = await RedirectUrl.findOne({ shortCode })
        .select("originalUrl")
        .lean();

    if (!url) {
        logger.warn({ shortCode }, "Short URL not found");
        throw new ApiError(404, "Short URL not found");
    }

    return url.originalUrl;
};

export default { getOriginalUrl };