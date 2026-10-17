import RedirectUrl from "../models/redirectUrl.model.js";
import { ApiError } from "../util/ApiError.js";

const getOriginalUrl = async (shortCode) => {
    if (!shortCode?.trim()) {
        throw new ApiError(400, "Short code is required");
    }

    try {
        const url = await RedirectUrl.findOne({ shortCode })
            .select("originalUrl")
            .lean();
        if (!url) {
            throw new ApiError(404, "Url Not Found");
        }
        return url;
    } catch (error) {
        if (error?.statusCode === 404) throw error;
        throw new ApiError(500, "Internal Server Error");
    }
}

export default { getOriginalUrl };