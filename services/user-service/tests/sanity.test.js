import request from "supertest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import app from "../src/app.js";
import connectDB from "../src/config/db.js";
import User from "../src/models/user.model.js";
import { generateAccessToken, generateRefreshToken } from "../src/util/auth.util.js";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "your_access_secret";
const JWT_ISSUER = process.env.JWT_ISSUER || "linkpulse";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "linkpulse-users";

describe("User Service & JWT Authentication Tests", () => {
    let validUser;
    let validAccessToken;

    beforeAll(async () => {
        await connectDB();
        await User.deleteMany({ email: /.*test.*@example\.com/ });

        validUser = await User.create({
            name: "Test Auth User",
            email: `test-${Date.now()}@example.com`,
            password: "HashedPassword123!",
            refreshToken: "sample_refresh_token",
        });

        validAccessToken = generateAccessToken(validUser._id.toString());
    });

    afterAll(async () => {
        await User.deleteMany({ email: /.*test.*@example\.com/ });
        await mongoose.disconnect();
    });

    describe("JWT Authentication Scenarios (GET /api/auth/me)", () => {
        it("should return HTTP 401 when token is missing", async () => {
            const response = await request(app).get("/api/auth/me");
            expect(response.status).toBe(401);
        });

        it("should return HTTP 401 when token is malformed", async () => {
            const response = await request(app)
                .get("/api/auth/me")
                .set("Authorization", "Bearer not-a-valid-jwt-token");

            expect(response.status).toBe(401);
        });

        it("should return HTTP 401 when token is signed with a different secret", async () => {
            const wrongSecretToken = jwt.sign(
                { userId: validUser._id.toString(), type: "access" },
                "different-secret-key",
                {
                    expiresIn: "15m",
                    issuer: JWT_ISSUER,
                    audience: JWT_AUDIENCE,
                }
            );

            const response = await request(app)
                .get("/api/auth/me")
                .set("Authorization", `Bearer ${wrongSecretToken}`);

            expect(response.status).toBe(401);
        });

        it("should return HTTP 401 when token is expired", async () => {
            const expiredToken = jwt.sign(
                { userId: validUser._id.toString(), type: "access" },
                JWT_ACCESS_SECRET,
                {
                    expiresIn: "0s",
                    issuer: JWT_ISSUER,
                    audience: JWT_AUDIENCE,
                }
            );

            await new Promise((resolve) => setTimeout(resolve, 50));

            const response = await request(app)
                .get("/api/auth/me")
                .set("Authorization", `Bearer ${expiredToken}`);

            expect(response.status).toBe(401);
        });

        it("should return HTTP 401 when token has an unexpected issuer", async () => {
            const invalidIssuerToken = jwt.sign(
                { userId: validUser._id.toString(), type: "access" },
                JWT_ACCESS_SECRET,
                {
                    expiresIn: "15m",
                    issuer: "unexpected-issuer",
                    audience: JWT_AUDIENCE,
                }
            );

            const response = await request(app)
                .get("/api/auth/me")
                .set("Authorization", `Bearer ${invalidIssuerToken}`);

            expect(response.status).toBe(401);
        });

        it("should return HTTP 401 when token has an unexpected audience", async () => {
            const invalidAudienceToken = jwt.sign(
                { userId: validUser._id.toString(), type: "access" },
                JWT_ACCESS_SECRET,
                {
                    expiresIn: "15m",
                    issuer: JWT_ISSUER,
                    audience: "unexpected-audience",
                }
            );

            const response = await request(app)
                .get("/api/auth/me")
                .set("Authorization", `Bearer ${invalidAudienceToken}`);

            expect(response.status).toBe(401);
        });

        it("should return HTTP 200 when token is valid", async () => {
            const response = await request(app)
                .get("/api/auth/me")
                .set("Authorization", `Bearer ${validAccessToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("data");
            expect(response.body.data.email).toBe(validUser.email);
        });
    });

    describe("POST /api/auth/register", () => {
        it("should register a new user successfully", async () => {
            const userData = {
                name: "John Doe",
                email: `john-${Date.now()}@example.com`,
                password: "Password123!",
            };

            const response = await request(app)
                .post("/api/auth/register")
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.data).toHaveProperty("user");
            expect(response.body.data.user.email).toBe(userData.email);
        });

        it("should return 400 for invalid email", async () => {
            const userData = {
                name: "Jane Doe",
                email: "invalid-email",
                password: "Password123!",
            };

            const response = await request(app)
                .post("/api/auth/register")
                .send(userData);

            expect(response.status).toBe(400);
        });

        it("should return 400 for weak password", async () => {
            const userData = {
                name: "Bob Smith",
                email: `bob-${Date.now()}@example.com`,
                password: "weak",
            };

            const response = await request(app)
                .post("/api/auth/register")
                .send(userData);

            expect(response.status).toBe(400);
        });
    });

    describe("POST /api/auth/login", () => {
        it("should login successfully with correct credentials", async () => {
            const email = `login-${Date.now()}@example.com`;
            await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Login User",
                    email,
                    password: "Password123!",
                });

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email,
                    password: "Password123!",
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("accessToken");
            expect(response.body.data).toHaveProperty("refreshToken");
        });

        it("should return 401 for incorrect password", async () => {
            const email = `login-fail-${Date.now()}@example.com`;
            await request(app)
                .post("/api/auth/register")
                .send({
                    name: "Login User",
                    email,
                    password: "Password123!",
                });

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email,
                    password: "WrongPassword123!",
                });

            expect(response.status).toBe(401);
        });
    });

    describe("POST /api/auth/refresh-token", () => {
        it("should refresh tokens successfully with valid refresh token", async () => {
            const refreshToken = generateRefreshToken(validUser._id.toString());
            validUser.refreshToken = refreshToken;
            await validUser.save({ validateBeforeSave: false });

            const response = await request(app)
                .post("/api/auth/refresh-token")
                .send({ refreshToken });

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty("accessToken");
        });

        it("should return 400 if refresh token is missing", async () => {
            const response = await request(app)
                .post("/api/auth/refresh-token")
                .send({});

            expect(response.status).toBe(400);
        });

        it("should return 401 if refresh token is malformed", async () => {
            const response = await request(app)
                .post("/api/auth/refresh-token")
                .send({ refreshToken: "malformed.refresh.token" });

            expect(response.status).toBe(401);
        });
    });
});
