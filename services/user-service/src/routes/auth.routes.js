import express from "express";
import { registerController, loginController, logoutController, getMeController, refreshTokensController } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { validate } from "../middlewares/validate.middleware.js";
import LoginRateLimit from "../middlewares/login-rate-limit.js";

const router = express.Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *         name:
 *           type: string
 *           example: "Alice Johnson"
 *         email:
 *           type: string
 *           format: email
 *           example: "alice@example.com"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-20T10:00:00.000Z"
 *     ApiResponse:
 *       type: object
 *       properties:
 *         statusCode:
 *           type: integer
 *           example: 200
 *         data:
 *           type: object
 *         message:
 *           type: string
 *           example: "Success"
 *         success:
 *           type: boolean
 *           example: true
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Invalid credentials"
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *           nullable: true
 *           example: null
 */

/**
 * @openapi
 * /api/auth/health:
 *   get:
 *     summary: Auth router health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Router is functioning properly
 *         content:
 *           application/json:
 *             example:
 *               message: "user-service auth router route is working fine"
 *               status: 200
 */
router.route("/health").get((req, res) => {
    return res.json({
        message: "user-service auth router route is working fine",
        status: 200
    });
});

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Alice Johnson"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "alice@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 128
 *                 description: "Must contain uppercase, lowercase, number, and special character"
 *                 example: "SecureP@ssw0rd!"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               statusCode: 201
 *               data:
 *                 user:
 *                   _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   name: "Alice Johnson"
 *                   email: "alice@example.com"
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               message: "User registered successfully"
 *               success: true
 *       400:
 *         description: Validation error or invalid inputs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Validation failed"
 *               errors:
 *                 - field: "password"
 *                   message: "Password must contain at least one uppercase letter"
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "email already exists"
 *               errors: null
 */
router.route("/register").post(validate(registerSchema), registerController);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and issue JWT tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "alice@example.com"
 *               password:
 *                 type: string
 *                 example: "SecureP@ssw0rd!"
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               statusCode: 200
 *               data:
 *                 user:
 *                   _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   name: "Alice Johnson"
 *                   email: "alice@example.com"
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               message: "User logged in successfully"
 *               success: true
 *       400:
 *         description: Invalid credentials or missing fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid credentials"
 *               errors: null
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Too many login attempts. Please try again in 15 minutes."
 *               errors: null
 */
router.route("/login").post(LoginRateLimit, validate(loginSchema), loginController);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and invalidate refresh token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               statusCode: 200
 *               data:
 *                 success: true
 *               message: "User logged out successfully"
 *               success: true
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Access token required"
 *               errors: null
 */
router.route("/logout").post(authenticate, logoutController);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Get currently authenticated user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               statusCode: 200
 *               data:
 *                 _id: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                 name: "Alice Johnson"
 *                 email: "alice@example.com"
 *               message: "User fetched successfully"
 *               success: true
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Access token required"
 *               errors: null
 */
router.route("/me").get(authenticate, getMeController);

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               statusCode: 200
 *               data:
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               message: "Tokens refreshed successfully"
 *               success: true
 *       400:
 *         description: Refresh token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "refresh token required"
 *               errors: null
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Token has expired"
 *               errors: null
 */
router.route("/refresh-token").post(refreshTokensController);

export default router;

