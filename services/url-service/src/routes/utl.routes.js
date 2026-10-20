import { Router } from "express";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import urlController from "../controllers/url.controller.js";

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Url:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6501a2b3c4d5e6f7a8b9c0e2"
 *         originalUrl:
 *           type: string
 *           format: uri
 *           example: "https://example.com/deep/resource?query=1"
 *         shortCode:
 *           type: string
 *           example: "aB3dE5gH"
 *         userId:
 *           type: string
 *           example: "64f1a2b3c4d5e6f7a8b9c0d1"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-10-20T10:00:00.000Z"
 *         updatedAt:
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
 * /api/urls:
 *   post:
 *     summary: Create a shortened URL
 *     description: Creates a short link associated with the authenticated user.
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalUrl
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/my-long-article-slug"
 *     responses:
 *       201:
 *         description: URL shortened successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               statusCode: 201
 *               data:
 *                 url:
 *                   _id: "6501a2b3c4d5e6f7a8b9c0e2"
 *                   originalUrl: "https://example.com/my-long-article-slug"
 *                   shortCode: "xY9kL2mQ"
 *                   userId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *                   createdAt: "2026-10-20T10:00:00.000Z"
 *               message: "URL created successfully"
 *               success: true
 *       400:
 *         description: Invalid destination URL format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid originalUrl format"
 *               errors: null
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Authorization token required"
 *               errors: null
 */
router.route("/")
    .post(authenticateToken, urlController.createShortUrl);

/**
 * @openapi
 * /api/urls/ownership/{shortCode}:
 *   get:
 *     summary: Check ownership of a URL by short code
 *     description: Verifies whether the authenticated user owns the given shortCode. Used internally by Analytics Service.
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shortCode
 *         required: true
 *         schema:
 *           type: string
 *         description: 8-character alphanumeric short code
 *         example: "xY9kL2mQ"
 *     responses:
 *       200:
 *         description: Ownership verified
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "URL owned by user"
 *               data:
 *                 shortCode: "xY9kL2mQ"
 *                 userId: "64f1a2b3c4d5e6f7a8b9c0d1"
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
 *         description: URL not found or not owned by user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "URL not found"
 */
router.route("/ownership/:shortCode")
    .get(authenticateToken, urlController.checkOwnership);

/**
 * @openapi
 * /api/urls/{urlId}:
 *   get:
 *     summary: Get URL by ID
 *     description: Retrieves URL details for the authenticated owner by MongoDB ID or short code.
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: urlId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId or shortCode
 *         example: "6501a2b3c4d5e6f7a8b9c0e2"
 *     responses:
 *       200:
 *         description: URL retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 url:
 *                   _id: "6501a2b3c4d5e6f7a8b9c0e2"
 *                   originalUrl: "https://example.com/my-long-article-slug"
 *                   shortCode: "xY9kL2mQ"
 *                   userId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: URL not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "URL not found"
 *   patch:
 *     summary: Update destination URL
 *     description: Modifies the target destination URL for the authenticated owner.
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: urlId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId or shortCode
 *         example: "6501a2b3c4d5e6f7a8b9c0e2"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalUrl
 *             properties:
 *               originalUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://updated-destination.com"
 *     responses:
 *       200:
 *         description: URL updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 url:
 *                   _id: "6501a2b3c4d5e6f7a8b9c0e2"
 *                   originalUrl: "https://updated-destination.com"
 *                   shortCode: "xY9kL2mQ"
 *                   userId: "64f1a2b3c4d5e6f7a8b9c0d1"
 *       400:
 *         description: Invalid destination URL
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: URL not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete a URL
 *     description: Permanently deletes a URL owned by the authenticated user.
 *     tags: [URLs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: urlId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId or shortCode
 *         example: "6501a2b3c4d5e6f7a8b9c0e2"
 *     responses:
 *       200:
 *         description: URL deleted successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "URL deleted successfully"
 *       401:
 *         description: Missing or invalid JWT
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: URL not found or unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/:urlId")
    .get(authenticateToken, urlController.getUrl)
    .patch(authenticateToken, urlController.updateUrl)
    .delete(authenticateToken, urlController.deleteUrl);

export default router;