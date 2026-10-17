import RedirectUrl from "../models/redirectUrl.model.js";
import { asyncHandler } from "../util/asyncHandler.js";

const SHORT_CODE_REGEX = /^[a-zA-Z0-9]{8}$/;

const redirectToOriginalUrl = asyncHandler(async (req, res) => {
    const { shortCode } = req.params;

    if (!SHORT_CODE_REGEX.test(shortCode)) {
        return res.status(400).json({
            success: false,
            message: "Invalid short code",
        });
    }

    let url;
    try {
        url = await RedirectUrl.findOne({ shortCode })
            .select("originalUrl")
            .lean();
    } catch (error) {
        console.error("Redirect failed:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }

    if (!url) {
        return res.status(404).json({
            success: false,
            message: "Short URL not found",
        });
    }

    // Defensive validation before redirecting
    let destination;
    try {
        destination = new URL(url.originalUrl);
    } catch {
        return res.status(500).json({
            success: false,
            message: "Stored destination URL is invalid",
        });
    }

    if (!["http:", "https:"].includes(destination.protocol)) {
        return res.status(500).json({
            success: false,
            message: "Stored destination URL is invalid",
        });
    }

    return res.redirect(302, destination.toString());
});

export default { redirectToOriginalUrl };
