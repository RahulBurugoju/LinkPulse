import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { getUrlAnalytics } from "../controllers/analytics.controller.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     DailyClick:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           example: "2026-10-20"
 *         clicks:
 *           type: integer
 *           example: 42
 *     AnalyticsData:
 *       type: object
 *       properties:
 *         shortCode:
 *           type: string
 *           example: "xY9kL2mQ"
 *         totalClicks:
 *           type: integer
 *           example: 153
 *         dailyClicks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DailyClick'
 *     AnalyticsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/AnalyticsData'
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "URL not found"
 */

/**
 * @openapi
 * /api/analytics/{shortCode}:
 *   get:
 *     summary: Get analytics for a shortened URL
 *     description: Retrieves total click counts and a 30-day daily breakdown for the requested short link. Requires authentication and validates link ownership with the URL Service.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[a-zA-Z0-9]{8}$"
 *         description: 8-character alphanumeric short code
 *         example: "xY9kL2mQ"
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsResponse'
 *             example:
 *               success: true
 *               data:
 *                 shortCode: "xY9kL2mQ"
 *                 totalClicks: 128
 *                 dailyClicks:
 *                   - date: "2026-10-18"
 *                     clicks: 40
 *                   - date: "2026-10-19"
 *                     clicks: 58
 *                   - date: "2026-10-20"
 *                     clicks: 30
 *       400:
 *         description: Invalid short code format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid short code"
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Authorization token required"
 *       404:
 *         description: URL not found or caller does not own this URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "URL not found"
 *       503:
 *         description: URL Service unavailable during ownership verification
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "URL Service unavailable"
 *       500:
 *         description: Internal server error querying analytics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to retrieve analytics"
 */
router.route("/:shortCode").get(authenticateToken, getUrlAnalytics);

export default router;

