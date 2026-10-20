import { asyncHandler } from "../util/asyncHandler.js";
import { ApiResponse } from "../util/ApiResponse.js";
import analyticsService from "../services/analytics.services.js";

const getUrlAnalytics = asyncHandler(async (req, res) => {
    const { shortCode } = req.params;

    const data = await analyticsService.getClicksByShortCode(shortCode);

    return res
        .status(200)
        .json(new ApiResponse(200, data, "Analytics fetched successfully"));
});

export {
    getUrlAnalytics,
};
