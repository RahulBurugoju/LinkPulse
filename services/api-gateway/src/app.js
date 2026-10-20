import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";

import env from "./config/env.js";
import logger from "./config/logger.js";
import globalRateLimiter from "./middlewares/rateLimiter.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows inline styles for gateway landing page
  })
);

// CORS
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
    credentials: true,
  })
);

// Cookie Parser
app.use(cookieParser());

// Request Correlation ID Middleware
app.use((req, res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
});

// Structured Pino Request Logger
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    customLogLevel(req, res, err) {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  })
);

// Global Rate Limiter
app.use(globalRateLimiter);

// -------------------------------------------------------------
// Gateway Health & Readiness Endpoints
// -------------------------------------------------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: env.SERVICE_NAME,
    timestamp: new Date().toISOString(),
  });
});

app.get("/ready", async (req, res) => {
  const services = [
    { name: "user-service", url: `${env.USER_SERVICE_URL}/health` },
    { name: "url-service", url: `${env.URL_SERVICE_URL}/health` },
    { name: "redirect-service", url: `${env.REDIRECT_SERVICE_URL}/health` },
    { name: "analytics-service", url: `${env.ANALYTICS_SERVICE_URL}/health` },
  ];

  const checks = {};
  let allHealthy = true;

  await Promise.all(
    services.map(async (svc) => {
      try {
        const response = await fetch(svc.url, {
          signal: AbortSignal.timeout(2000),
        });
        if (response.ok) {
          checks[svc.name] = "up";
        } else {
          checks[svc.name] = "down";
          allHealthy = false;
        }
      } catch {
        checks[svc.name] = "unreachable";
        allHealthy = false;
      }
    })
  );

  return res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "ready" : "degraded",
    service: env.SERVICE_NAME,
    checks,
  });
});

// -------------------------------------------------------------
// Gateway Information & Unified Documentation Portal
// -------------------------------------------------------------
app.get("/", (req, res) => {
  res.status(200).json({
    name: "LinkPulse API Gateway",
    version: "1.0.0",
    description: "Unified entry point for LinkPulse microservices",
    endpoints: {
      auth: "/api/auth/*",
      urls: "/api/urls/*",
      analytics: "/api/analytics/*",
      redirect: "/:shortCode",
      documentation: "/api-docs",
      health: "/health",
      readiness: "/ready",
    },
    docs: {
      user: `${env.USER_SERVICE_URL}/api-docs`,
      url: `${env.URL_SERVICE_URL}/api-docs`,
      redirect: `${env.REDIRECT_SERVICE_URL}/api-docs`,
      analytics: `${env.ANALYTICS_SERVICE_URL}/api-docs`,
    },
  });
});

app.get("/api-docs", (req, res) => {
  res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>LinkPulse Microservices API Documentation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { color: #38bdf8; font-size: 2.2rem; }
    p { color: #94a3b8; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-top: 30px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; transition: transform 0.2s, border-color 0.2s; text-decoration: none; color: inherit; }
    .card:hover { transform: translateY(-4px); border-color: #38bdf8; }
    .card h3 { margin-top: 0; color: #f1f5f9; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; background: #0369a1; color: #e0f2fe; margin-bottom: 12px; }
    .url { font-family: monospace; color: #38bdf8; font-size: 0.85rem; word-break: break-all; }
  </style>
</head>
<body>
  <div class="container">
    <h1>LinkPulse API Portal</h1>
    <p>Explore and test the interactive OpenAPI / Swagger UI documentation for each LinkPulse microservice:</p>
    <div class="grid">
      <a class="card" href="${env.USER_SERVICE_URL}/api-docs" target="_blank" rel="noreferrer">
        <span class="badge">Port 3001</span>
        <h3>User Service</h3>
        <p>User registration, authentication, login rate limiting, session profile, and refresh token endpoints.</p>
        <span class="url">${env.USER_SERVICE_URL}/api-docs</span>
      </a>
      <a class="card" href="${env.URL_SERVICE_URL}/api-docs" target="_blank" rel="noreferrer">
        <span class="badge">Port 3002</span>
        <h3>URL Service</h3>
        <p>Short URL creation, owner-scoped URL management (read, update, delete), and ownership checks.</p>
        <span class="url">${env.URL_SERVICE_URL}/api-docs</span>
      </a>
      <a class="card" href="${env.REDIRECT_SERVICE_URL}/api-docs" target="_blank" rel="noreferrer">
        <span class="badge">Port 3003</span>
        <h3>Redirect Service</h3>
        <p>High-performance public 302 redirect engine with Redis caching and asynchronous Kafka click event dispatch.</p>
        <span class="url">${env.REDIRECT_SERVICE_URL}/api-docs</span>
      </a>
      <a class="card" href="${env.ANALYTICS_SERVICE_URL}/api-docs" target="_blank" rel="noreferrer">
        <span class="badge">Port 3004</span>
        <h3>Analytics Service</h3>
        <p>Aggregated click counts and 30-day daily analytics breakdowns with ownership validation.</p>
        <span class="url">${env.ANALYTICS_SERVICE_URL}/api-docs</span>
      </a>
    </div>
  </div>
</body>
</html>
  `);
});

// -------------------------------------------------------------
// Proxy Helper Factory
// -------------------------------------------------------------
function createServiceProxy(pathFilter, target, serviceName) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathFilter,
    xfwd: true,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.id) {
          proxyReq.setHeader("x-request-id", req.id);
        }
        if (req.body && Object.keys(req.body).length > 0) {
          fixRequestBody(proxyReq, req);
        }
      },
      error: (err, req, res) => {
        logger.error(
          {
            err: err.message,
            service: serviceName,
            target,
            path: req.originalUrl,
          },
          `Upstream service ${serviceName} unreachable`
        );
        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            message: `Service unavailable: ${serviceName} is temporarily unreachable`,
            errors: null,
          });
        }
      },
    },
  });
}

// -------------------------------------------------------------
// Downstream Service Proxies
// -------------------------------------------------------------

// 1. User Service (/api/auth)
app.use(createServiceProxy("/api/auth", env.USER_SERVICE_URL, "user-service"));

// 2. URL Service (/api/urls and /api/v1/url)
app.use(createServiceProxy(["/api/urls", "/api/v1/url"], env.URL_SERVICE_URL, "url-service"));

// 3. Analytics Service (/api/analytics and /api/v1/analytics)
app.use(createServiceProxy(["/api/analytics", "/api/v1/analytics"], env.ANALYTICS_SERVICE_URL, "analytics-service"));

// 4. Redirect Service (8-character alphanumeric short code)
app.use(
  createServiceProxy(
    (pathname, req) => req.method === "GET" && /^\/[a-zA-Z0-9]{8}$/.test(pathname),
    env.REDIRECT_SERVICE_URL,
    "redirect-service"
  )
);

// -------------------------------------------------------------
// 404 & Centralized Error Handlers
// -------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
