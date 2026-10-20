import { asyncHandler } from "../util/asyncHandler.js";
import { ApiError } from "../util/ApiError.js";
import { ApiResponse } from "../util/ApiResponse.js";
import urlService from "../services/url.service.js";

const createShortUrl = asyncHandler(async (req, res, next) => {
    const { originalUrl } = req.body;
    const userId = req.user.id || req.user.Id;

    const url = await urlService.createShortUrl({ originalUrl, userId });

    res.status(201).json(new ApiResponse(201, { url }, "URL created successfully"));
});

export default { createShortUrl };