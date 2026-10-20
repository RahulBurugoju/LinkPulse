import { asyncHandler } from "../util/asyncHandler.js";
import { ApiResponse } from "../util/ApiResponse.js";
import urlService from "../services/url.service.js";

const createShortUrl = asyncHandler(async (req, res) => {
    const { originalUrl } = req.body;
    const userId = req.user.id || req.user.Id;

    const url = await urlService.createShortUrl({ originalUrl, userId });

    res.status(201).json(new ApiResponse(201, { url }, "URL created successfully"));
});

const getUrl = asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user.Id;
    const url = await urlService.getUrlByIdAndOwner({
        urlId: req.params.urlId,
        userId,
    });

    if (!url) {
        return res.status(404).json({
            success: false,
            message: "URL not found",
        });
    }

    return res.status(200).json({
        success: true,
        data: { url },
    });
});

const updateUrl = asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user.Id;
    const { originalUrl } = req.body;

    const url = await urlService.updateUrlByIdAndOwner({
        urlId: req.params.urlId,
        userId,
        originalUrl,
    });

    if (!url) {
        return res.status(404).json({
            success: false,
            message: "URL not found",
        });
    }

    return res.status(200).json({
        success: true,
        data: { url },
    });
});

const deleteUrl = asyncHandler(async (req, res) => {
    const userId = req.user.id || req.user.Id;
    const url = await urlService.deleteUrlByIdAndOwner({
        urlId: req.params.urlId,
        userId,
    });

    if (!url) {
        return res.status(404).json({
            success: false,
            message: "URL not found",
        });
    }

    return res.status(200).json({
        success: true,
        message: "URL deleted successfully",
    });
});

const checkOwnership = asyncHandler(async (req, res) => {
    const { shortCode } = req.params;
    const userId = req.user.id || req.user.Id;

    const url = await urlService.getUrlByIdAndOwner({
        urlId: shortCode,
        userId,
    });

    if (!url) {
        return res.status(404).json({
            success: false,
            message: "URL not found",
        });
    }

    return res.status(200).json({
        success: true,
        message: "URL ownership verified",
        data: {
            shortCode: url.shortCode,
            userId: url.userId,
            originalUrl: url.originalUrl,
        },
    });
});

export default {
    createShortUrl,
    getUrl,
    updateUrl,
    deleteUrl,
    checkOwnership,
};