import mongoose from "mongoose"


const urlSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            immutable: true,
            index: true,
        },

        originalUrl: {
            type: String,
            required: true,
            maxlength: 2048,
        },

        shortCode: {
            type: String,
            required: true,
            unique: true,
            minlength: 8,
            maxlength: 8,
            match: /^[a-zA-Z0-9]{8}$/,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

urlSchema.index({ userId: 1, createdAt: -1 });

const Url = mongoose.model("Url", urlSchema);

export default Url;
