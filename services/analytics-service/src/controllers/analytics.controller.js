import ClickEvent from "../models/click-event.model.js";
import logger from "../config/logger.js";

async function getUrlAnalytics(req, res) {
    try {
        const { shortCode } = req.params;

        if (!/^[a-zA-Z0-9]{8}$/.test(shortCode)) {
            return res.status(400).json({
                success: false,
                message: "Invalid short code",
            });
        }

        // Verify ownership with URL Service
        const urlServiceUrl = process.env.URL_SERVICE_URL || "http://localhost:3002";
        let ownershipRes;
        try {
            ownershipRes = await fetch(`${urlServiceUrl}/api/urls/ownership/${shortCode}`, {
                method: "GET",
                headers: {
                    Authorization: req.headers.authorization,
                },
                signal: AbortSignal.timeout(3000),
            });
        } catch (err) {
            logger.error({ err: err.message, shortCode }, "URL Service unavailable during ownership verification");
            return res.status(503).json({
                success: false,
                message: "URL Service unavailable",
            });
        }

        if (ownershipRes.status === 404) {
            logger.warn({ shortCode }, "Ownership verification failed: URL not found or not owned");
            return res.status(404).json({
                success: false,
                message: "URL not found",
            });
        }

        if (!ownershipRes.ok) {
            if (ownershipRes.status >= 500) {
                logger.error({ shortCode, status: ownershipRes.status }, "URL Service error during ownership verification");
                return res.status(503).json({
                    success: false,
                    message: "URL Service unavailable",
                });
            }
            logger.warn({ shortCode, status: ownershipRes.status }, "Ownership verification failed");
            return res.status(ownershipRes.status).json({
                success: false,
                message: "Ownership verification failed",
            });
        }

        // Total clicks across all time
        const totalClicks = await ClickEvent.countDocuments({
            shortCode,
        });

        // Daily breakdown for the last 30 days
        const thirtyDaysAgo = new Date(
            Date.now() - 30 * 24 * 60 * 60 * 1000
        );

        const dailyClicks = await ClickEvent.aggregate([
            {
                $match: {
                    shortCode,
                    timestamp: { $gte: thirtyDaysAgo },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$timestamp",
                            timezone: "UTC",
                        },
                    },
                    clicks: { $sum: 1 },
                },
            },
            {
                $sort: { _id: 1 },
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    clicks: 1,
                },
            },
        ]);

        return res.status(200).json({
            success: true,
            data: {
                shortCode,
                totalClicks,
                dailyClicks,
            },
        });
    } catch (error) {
        logger.error({ err: error.message, shortCode: req.params.shortCode }, "Analytics query failed");

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve analytics",
        });
    }
}

export { getUrlAnalytics };
export default { getUrlAnalytics };
