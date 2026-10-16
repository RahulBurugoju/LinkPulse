import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/user.model.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });

        const email = `day4-${Date.now()}@example.com`;
        const passwordHash = await bcrypt.hash("DemoPassword123!", 12);

        const user = await User.create({
            name: "LinkPulse Test User",
            email,
            passwordHash,
        });

        console.log("Created user:", {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
        });

        const foundUser = await User.findById(user._id);

        if (!foundUser) {
            throw new Error("User was not found after saving");
        }

        console.log("Retrieved user successfully:", foundUser.email);

        const userWithHash = await User.findById(user._id).select("+passwordHash");

        if (!userWithHash.passwordHash.startsWith("$2")) {
            throw new Error("Password hash does not look like a bcrypt hash");
        }

        console.log("Password hash verified; plaintext password was not stored.");

        await User.deleteOne({ _id: user._id });
        console.log("Test user cleaned up.");
    } finally {
        await mongoose.disconnect();
    }
}

main().catch((error) => {
    console.error("User model test failed:", error.message);
    process.exitCode = 1;
});