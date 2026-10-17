import mongoose from "mongoose";

const redirectUrlSchema = new mongoose.Schema(
    {
        originalUrl: String,
        shortCode: String,
    },
    {
        collection: "urls",
        versionKey: false,
    }
);

redirectUrlSchema.index({ shortCode: 1 });

const RedirectUrl = mongoose.model("RedirectUrl", redirectUrlSchema);

export default RedirectUrl;