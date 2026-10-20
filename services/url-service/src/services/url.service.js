import crypto from "node:crypto";
import mongoose from "mongoose";
import Url from "../models/url.model.js";
import { ApiError } from "../util/ApiError.js";

async function createShortUrl({ originalUrl, userId }) {
    for (let attempt = 0; attempt < 3; attempt++) {
        const shortCode = crypto.randomBytes(6).toString("base64url").slice(0, 8);

        try {
            const url = await Url.create({
                originalUrl,
                userId,
                shortCode,
            });

            return {
                id: url._id.toString(),
                originalUrl: url.originalUrl,
                shortCode: url.shortCode,
                shortUrl: `http://localhost:3003/${url.shortCode}`,
                userId: url.userId,
            };
        } catch (error) {
            if (error.code === 11000 && error.keyPattern?.shortCode) {
                continue;
            }

            throw error;
        }
    }

    throw new ApiError(503, "Could not generate a unique short code");
}

function getQuery(urlId, userId) {
    return mongoose.Types.ObjectId.isValid(urlId)
        ? { _id: urlId, userId }
        : { shortCode: urlId, userId };
}

async function getUrlByIdAndOwner({ urlId, userId }) {
    const query = getQuery(urlId, userId);
    return await Url.findOne(query);
}

async function updateUrlByIdAndOwner({ urlId, userId, originalUrl }) {
    const query = getQuery(urlId, userId);
    return await Url.findOneAndUpdate(
        query,
        {
            $set: {
                originalUrl,
            },
        },
        {
            new: true,
            runValidators: true,
        }
    );
}

async function deleteUrlByIdAndOwner({ urlId, userId }) {
    const query = getQuery(urlId, userId);
    return await Url.findOneAndDelete(query);
}

export default {
    createShortUrl,
    getUrlByIdAndOwner,
    updateUrlByIdAndOwner,
    deleteUrlByIdAndOwner,
};