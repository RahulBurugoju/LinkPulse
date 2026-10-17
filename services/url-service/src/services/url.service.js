import crypto from "node:crypto";
import Url from "../models/url.model.js";
import { ApiError } from "../util/ApiError.js";
import { deflate } from "node:zlib";




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




export default { createShortUrl };