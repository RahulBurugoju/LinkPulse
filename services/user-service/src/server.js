import app from "./app.js";
import connectDB from "./config/dataBase.js";

const PORT = process.env.PORT || 3001;
const SERVICE_NAME = process.env.SERVICE_NAME || "user-service";

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`${SERVICE_NAME} is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
