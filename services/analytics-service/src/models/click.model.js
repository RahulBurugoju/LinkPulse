import mongoose from "mongoose";

const clickSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
            unique: true,
        },
        shortCode: {
            type: String,
            required: true,
            index: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
        referrer: {
            type: String,
            default: null,
        },
        userAgent: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

clickSchema.index({ shortCode: 1, timestamp: -1 });

const Click = mongoose.model("Click", clickSchema);

export default Click;
