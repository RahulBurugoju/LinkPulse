import { asyncHandler } from "../util/asyncHandler.js";
import { ApiResponse } from "../util/ApiResponse.js";
import redirectServices from "../services/redirect.services.js";

const SHORT_CODE_REGEX = /^[a-zA-Z0-9]{8}$/;

const redirectToOriginalUrl = asyncHandler(async (req, res) => {
    const { shortCode } = req.params;

    if (!SHORT_CODE_REGEX.test(shortCode)) {
        return res
            .status(400)
            .json(new ApiResponse(400, null, "Invalid short code"));
    }

    const originalUrl = await redirectServices.getOriginalUrl(shortCode);

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

export  { redirectToOriginalUrl };
