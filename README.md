# LinkPulse Microservices Platform

LinkPulse is a distributed URL shortening, redirection, and real-time analytics platform built with Node.js microservices, MongoDB, Redis, and Apache Kafka.

---

## Architecture Overview

```
                          [ Client / Browser ]
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │  API Gateway (Port 3000)      │
                   │  - Helmet / CORS              │
                   │  - Global Rate Limiter        │
                   │  - X-Request-Id Correlation   │
                   │  - Unified /health & /ready   │
                   │  - API Portal (/api-docs)     │
                   └───────┬───────────┬───────────┘
                           │           │
         ┌─────────────────┼───────────┼─────────────────┐
         │                 │           │                 │
         ▼                 ▼           ▼                 ▼
 ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
 │ User Service  │ │  URL Service  │ │Redirect Service│ │Analytics Serv.│
 │  (Port 3001)  │ │  (Port 3002)  │ │  (Port 3003)  │ │  (Port 3004)  │
 │  /api/auth    │ │  /api/urls    │ │  /:shortCode  │ │/api/analytics │
 └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
         │                 │                 │                 │
         ▼                 ▼                 ▼                 ▼
     [MongoDB]         [MongoDB]       [Redis Cache]       [MongoDB]
                                             │                 ▲
                                             ▼                 │
                                      [Kafka Broker] ──────────┘
                                      (Event Driven)
```

---

## Services & Ports

| Service | Port | Base Path | Description |
| :--- | :---: | :--- | :--- |
| **API Gateway** | `3000` | `/` | Reverse proxy, rate limiting, and unified API entry point |
| **User Service** | `3001` | `/api/auth` | User registration, login, JWT issuance, rate limiting |
| **URL Service** | `3002` | `/api/urls` | Short URL creation, ownership verification, URL management |
| **Redirect Service**| `3003` | `/:shortCode` | Fast 302 redirection with Redis caching & Kafka event publishing |
| **Analytics Service**| `3004` | `/api/analytics` | Aggregated click counts and 30-day daily analytics |

---

## API Gateway Routing

- `POST /api/auth/*` ➔ **User Service** (`http://localhost:3001/api/auth/*`)
- `POST|GET|PATCH|DELETE /api/urls/*` ➔ **URL Service** (`http://localhost:3002/api/urls/*`)
- `GET /:shortCode` (8-char alphanumeric) ➔ **Redirect Service** (`http://localhost:3003/:shortCode`)
- `GET /api/analytics/:shortCode` ➔ **Analytics Service** (`http://localhost:3004/api/analytics/:shortCode`)
- `GET /health` ➔ Gateway health status
- `GET /ready` ➔ Gateway readiness (probes all downstream services)
- `GET /api-docs` ➔ Interactive visual documentation portal linking to all downstream Swagger UIs

---

## Quick Start

### 1. Start Infrastructure (Docker)
```bash
docker compose up -d
```

### 2. Start Microservices & API Gateway
```bash
npm run start:gateway
npm run start:user
npm run start:url
npm run start:redirect
npm run start:analytics
```
