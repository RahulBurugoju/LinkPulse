import { Router } from "express";
import { redirectToOriginalUrl } from "../controllers/redirect.controller.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         statusCode:
 *           type: integer
 *           example: 400
 *         data:
 *           type: object
 *           nullable: true
 *           example: null
 *         message:
 *           type: string
 *           example: "Invalid short code"
 *         success:
 *           type: boolean
 *           example: false
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "URL not found"
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *           nullable: true
 *           example: null
 */

/**
 * @openapi
 * /{shortCode}:
 *   get:
 *     summary: Redirect short link to destination URL
 *     description: Resolves the 8-character shortCode (from Redis cache or MongoDB), publishes an asynchronous click event to Kafka, and responds with a 302 redirect.
 *     tags: [Redirect]
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[a-zA-Z0-9]{8}$"
 *         description: The 8-character unique short code
 *         example: "xY9kL2mQ"
 *     responses:
 *       302:
 *         description: Successful lookup - redirecting to original target URL
 *         headers:
 *           Location:
 *             description: The destination URL
 *             schema:
 *               type: string
 *               format: uri
 *               example: "https://example.com/target-page"
 *       400:
 *         description: Invalid short code format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               statusCode: 400
 *               data: null
 *               message: "Invalid short code"
 *               success: false
 *       404:
 *         description: Short code not found in database or cache
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "URL not found"
 *       500:
 *         description: Stored destination URL invalid or server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               statusCode: 500
 *               data: null
 *               message: "Stored destination URL is invalid"
 *               success: false
 */
router.route("/:shortCode").get(redirectToOriginalUrl);

export default router;

