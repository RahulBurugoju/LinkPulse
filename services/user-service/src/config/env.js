import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const envSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),

    PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(3001),

    SERVICE_NAME: z.string().default("user-service"),
    MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
    JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
    JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
    ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
    REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
    JWT_ISSUER: z.string().default("linkpulse"),
    JWT_AUDIENCE: z.string().default("linkpulse-users"),
    LOG_LEVEL: z.string().default("info"),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
    console.error("Invalid environment configuration in user-service:");
    console.error(
        result.error.issues.map((issue) => ({
            variable: issue.path.join("."),
            message: issue.message,
        }))
    );
    process.exit(1);
}

export const env = result.data;
export default env;
