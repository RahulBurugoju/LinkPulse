import mongoose from "mongoose";
import logger from "./logger.js";

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in environment variables.");
    }

    const conn = await mongoose.connect(mongoUri);

    logger.info({ host: conn.connection.host }, "MongoDB connected");
  } catch (error) {
    logger.error({ err: error }, "Database connection error");
    process.exit(1);
  }
};

export default connectDB;
// export { connectDB };
