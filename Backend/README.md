# Community Hero — Backend

AI-powered community issue reporting platform. Citizens report civic issues
(potholes, water leakage, garbage, broken streetlights, etc.) and AI handles
analysis, validation, routing, prioritization, and tracking.

## Tech Stack

- **Runtime:** Node.js + Express
- **Database:** PostgreSQL via Prisma ORM
- **Storage:** Cloudinary (images/videos)
- **AI:** Google Gemini 2.5 Flash + Gemini Vision
- **Auth:** JWT

## Project Structure

```
Backend/
├── prisma/
│   └── schema.prisma         # Database models & enums
├── src/
│   ├── config/               # Prisma, Cloudinary, Gemini clients
│   ├── middleware/           # auth (JWT), error handler, multer upload
│   ├── utils/                # ApiError, asyncHandler, response helpers
│   ├── services/             # Gemini AI, priority scoring, duplicate detection
│   ├── controllers/          # Request handlers
│   ├── routes/               # Express route definitions
│   ├── app.js                # Express app setup (middleware, routes)
│   └── server.js             # Entry point
├── .env.example
└── package.json
```

## Features (mapped to backend modules)

| # | Feature | Module |
|---|---------|--------|
| 1 | Smart Image Understanding | `services/gemini.service.js` |
| 2 | Duplicate Detection | `services/duplicate.service.js` |
| 3 | Auto Priority | `services/priority.service.js` |
| 4 | AI Summary | `services/gemini.service.js` |
| 5 | Department Routing | `services/gemini.service.js` + Department model |
| 6 | AI Chat Assistant | `controllers/chat.controller.js` |
| 7 | Geo Mapping | Issue lat/lng + `GET /issues/map` |
| 8 | Community Verification | `controllers/verification.controller.js` |
| 9 | Impact Dashboard | `controllers/dashboard.controller.js` |
| 10 | Predictive AI | `services/gemini.service.js` (stub) |
| 11 | Voice Reporting | `services/gemini.service.js` (transcription stub) |
| 12 | Emergency Detection | `services/gemini.service.js` |
| 13 | Progress Timeline | `TimelineEvent` model |

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # then fill in DATABASE_URL, JWT_SECRET, Cloudinary & Gemini keys
   ```

3. **Set up the database**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Run the server**
   ```bash
   npm run dev      # watch mode
   # or
   npm start
   ```

The API will be available at `http://localhost:5000`.

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a citizen |
| POST | `/api/auth/login` | Log in, returns JWT |
| GET | `/api/auth/me` | Current user |
| POST | `/api/issues` | Report an issue (with image upload + AI analysis) |
| GET | `/api/issues` | List/filter issues |
| GET | `/api/issues/map` | Issues for the map view |
| GET | `/api/issues/:id` | Issue detail + timeline |
| PATCH | `/api/issues/:id/status` | Update status (officer/admin) |
| POST | `/api/issues/:id/vote` | Upvote / support an issue |
| POST | `/api/issues/:id/verify` | Community verification (yes/no) |
| GET | `/api/dashboard/stats` | Impact dashboard metrics |
| POST | `/api/chat` | AI chat assistant |

> Health check: `GET /health`
