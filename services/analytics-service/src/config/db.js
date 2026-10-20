import mongoose from "mongoose";
import logger from "./logger.js";

async function connectDatabase() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("MONGODB_URI is not configured");
    }

    const conn = await mongoose.connect(uri);

    logger.info({ host: conn.connection.host }, "MongoDB connected");
}

export { connectDatabase, connectDatabase as connectDB };
export default connectDatabase;
