import mongoose from "mongoose";

const clickEventSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
            unique: true,
            immutable: true,
        },
        shortCode: {
            type: String,
            required: true,
            index: true,
        },
        timestamp: {
            type: Date,
            required: true,
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
        collection: "click_events",
    }
);

clickEventSchema.index({
    shortCode: 1,
    timestamp: 1,
});

const ClickEvent = mongoose.model("ClickEvent", clickEventSchema);

export { clickEventSchema };
export default ClickEvent;
