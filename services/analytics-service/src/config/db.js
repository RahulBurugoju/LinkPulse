import mongoose from "mongoose";

async function connectDatabase() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("MONGODB_URI is not configured");
    }

    await mongoose.connect(uri);

    console.log("Analytics Service connected to MongoDB");
}

export { connectDatabase, connectDatabase as connectDB };
export default connectDatabase;
