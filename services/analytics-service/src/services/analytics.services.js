import ClickEvent from "../models/click-event.model.js";
import { ApiError } from "../util/ApiError.js";

const recordClick = async (eventData) => {
    try {
        const click = await ClickEvent.create(eventData);
        return click;
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate eventId, idempotent ignore
            return null;
        }
        throw error;
    }
};

const getClicksByShortCode = async (shortCode) => {
    if (!shortCode) {
        throw new ApiError(400, "Short code is required");
    }

    const totalClicks = await ClickEvent.countDocuments({ shortCode });
    const recentClicks = await ClickEvent.find({ shortCode })
        .sort({ timestamp: -1 })
        .limit(100)
        .lean();

    return {
        shortCode,
        totalClicks,
        recentClicks,
    };
};

export default {
    recordClick,
    getClicksByShortCode,
};
