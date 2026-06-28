# Community Hero — Backend Documentation

Complete reference for the Community Hero backend: architecture, data model,
AI pipeline, API endpoints, and setup.

- **Runtime:** Node.js 22 + Express 4 (ES modules)
- **Database:** PostgreSQL via Prisma ORM
- **Storage:** Cloudinary (images/videos)
- **AI:** Google Gemini 2.5 Flash + Gemini Vision
- **Auth:** JWT (Bearer tokens)

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Project Structure](#2-project-structure)
3. [Data Model](#3-data-model)
4. [The AI Pipeline](#4-the-ai-pipeline)
5. [Feature Mapping](#5-feature-mapping)
6. [API Reference](#6-api-reference)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Configuration](#8-configuration)
9. [Setup & Running](#9-setup--running)
10. [Conventions & Error Handling](#10-conventions--error-handling)
11. [Security Notes](#11-security-notes)

---

## 1. Architecture

The backend follows a layered architecture. A request flows top to bottom:

```
HTTP Request
    │
    ▼
Routes (src/routes)            ── URL → handler mapping, attaches middleware
    │
    ▼
Middleware                     ── auth (JWT), multer upload, rate limit
    │
    ▼
Controllers (src/controllers)  ── validate input (zod), orchestrate, shape response
    │
    ▼
Services (src/services)        ── business logic: AI, priority, duplicates, uploads
    │
    ▼
Prisma Client (src/config)     ── database access
    │
    ▼
PostgreSQL
```

**Design principles**

- **Controllers stay thin** — they validate, call services, and format responses.
- **Services hold the logic** — AI calls, scoring, duplicate search, and uploads
  are isolated and independently testable.
- **Graceful degradation** — every external integration (Gemini, Cloudinary)
  has a fallback so the API keeps working when keys are missing.
- **Consistent envelopes** — all responses share a `{ success, message, data }`
  shape via `utils/response.js`.

---

## 2. Project Structure

```
Backend/
├── prisma/
│   ├── schema.prisma           # Models & enums
│   └── seed.js                 # Default departments + demo admin
├── src/
│   ├── config/
│   │   ├── env.js              # Centralized, validated env vars
│   │   ├── prisma.js           # Singleton Prisma client
│   │   ├── cloudinary.js       # Cloudinary client + isConfigured flag
│   │   └── gemini.js           # Gemini model factories + isConfigured flag
│   ├── middleware/
│   │   ├── auth.js             # authenticate / authorize / optionalAuth
│   │   ├── errorHandler.js     # notFound + global error handler
│   │   └── upload.js           # multer (memory) for media & audio
│   ├── utils/
│   │   ├── ApiError.js         # Operational error with HTTP status
│   │   ├── asyncHandler.js     # Async route error forwarding
│   │   ├── response.js         # sendSuccess / sendCreated / sendPaginated
│   │   └── token.js            # JWT sign / verify
│   ├── services/
│   │   ├── gemini.service.js       # Image analysis, summary, chat, predict, voice
│   │   ├── priority.service.js     # Priority scoring
│   │   ├── duplicate.service.js    # Geo duplicate detection
│   │   └── cloudinary.service.js   # Upload / delete media
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── issue.controller.js
│   │   ├── vote.controller.js
│   │   ├── verification.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── chat.controller.js
│   │   └── voice.controller.js
│   ├── routes/
│   │   ├── index.js            # Aggregates all routers under /api
│   │   ├── auth.routes.js
│   │   ├── issue.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── chat.routes.js
│   │   ├── voice.routes.js
│   │   └── department.routes.js
│   ├── app.js                  # Express app (middleware, routes, errors)
│   └── server.js               # Entry point + graceful shutdown
├── .env.example
├── package.json
└── README.md
```

---

## 3. Data Model

Defined in `prisma/schema.prisma`. PostgreSQL via Prisma.

### Entity relationships

```
User ──< Issue (reporter)
User >── Department (officers belong to a department)
Department ──< Issue (routing target)
Issue ──< IssueImage
Issue ──< Vote          (community upvotes)
Issue ──< Support       (backing a duplicate)
Issue ──< Verification  (community yes/no)
Issue ──< TimelineEvent (progress history)
User ──< ChatMessage
```

### Models

**User**
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | |
| email | String | unique |
| password | String | bcrypt hash |
| role | Role | `CITIZEN` (default), `OFFICER`, `ADMIN` |
| latitude/longitude | Float? | home location for nearby verification |
| departmentId | String? | officers only |

**Department** — routing targets (Feature 5)
| Field | Type | Notes |
|-------|------|-------|
| id | String | PK |
| name | String | unique |
| description | String? | |

**Issue** — the canonical civic issue
| Field | Type | Notes |
|-------|------|-------|
| id | String | PK |
| title | String | |
| description | String | raw citizen text |
| aiSummary | String? | AI-cleaned summary (Feature 4) |
| estimatedDiameter | String? | e.g. "2.4 meters" (Feature 1) |
| category | IssueCategory | AI-assigned |
| severity | Severity | AI-assigned |
| risk | RiskLevel | AI-assigned |
| priorityScore | Float | computed (Feature 3) |
| priority | PriorityLevel | derived from score |
| isEmergency | Boolean | Feature 12 |
| status | IssueStatus | timeline state |
| latitude/longitude | Float | geo (Feature 7) |
| address | String? | |
| trafficLevel | Int | 0–5, priority signal |
| peopleAffected | Int | priority signal |
| schoolNearby | Boolean | priority signal |
| hospitalNearby | Boolean | priority signal |
| reporterId | String | FK → User |
| departmentId | String? | FK → Department |

**IssueImage** — Cloudinary media (`url`, `publicId`, `isVideo`).
**Vote** — community upvote; unique per `(issueId, userId)`.
**Support** — backing an existing issue instead of duplicating; unique per `(issueId, userId)`.
**Verification** — community `YES`/`NO`; unique per `(issueId, userId)`.
**TimelineEvent** — `status`, optional `note`, optional `actorId` (Feature 13).
**ChatMessage** — `role` (`USER`/`ASSISTANT`), `content`, optional `issueId`.

### Enums

| Enum | Values |
|------|--------|
| Role | CITIZEN, OFFICER, ADMIN |
| IssueCategory | POTHOLE, WATER_LEAKAGE, GARBAGE, STREET_LIGHT, ROAD_DAMAGE, OPEN_MANHOLE, ILLEGAL_DUMPING, FALLEN_TREE, DRAINAGE_BLOCKAGE, OTHER |
| Severity | LOW, MEDIUM, HIGH, CRITICAL |
| RiskLevel | LOW, MEDIUM, HIGH, VERY_HIGH |
| PriorityLevel | LOW, MEDIUM, HIGH, CRITICAL |
| IssueStatus | REPORTED, VERIFIED, ASSIGNED, ENGINEER_VISITED, REPAIR_STARTED, COMPLETED, REJECTED |
| VerificationAnswer | YES, NO |
| ChatRole | USER, ASSISTANT |

---

## 4. The AI Pipeline

`POST /api/issues` chains the AI-driven features in a single flow:

```
Citizen submits report (text + optional image/video)
        │
        ▼
1. analyzeIssueImage()        → category, severity, risk, isEmergency,
   (gemini.service.js)          estimatedDiameter, summary           [Feat 1, 12]
        │
        ▼
2. findDuplicates()           → open issues of same category within ~100 m
   (duplicate.service.js)       If found → 409 with the existing issue [Feat 2]
        │  (skipped if forceCreate=true)
        ▼
3. summarizeDescription()     → clean, professional summary           [Feat 4]
   (gemini.service.js)
        │
        ▼
4. computePriority()          → priorityScore + priority level        [Feat 3]
   (priority.service.js)        emergencies are forced to CRITICAL
        │
        ▼
5. suggestDepartment()        → route to matching Department          [Feat 5]
   (gemini.service.js)
        │
        ▼
6. uploadMany()               → media to Cloudinary (best-effort)
   (cloudinary.service.js)
        │
        ▼
7. prisma.issue.create()      → persist issue + IssueImages + initial
                                 TimelineEvent (REPORTED)             [Feat 13]
```

### Priority scoring formula

`priority.service.js → computePriority()`

Every report gets a **score (0–100)** and a **level**. The inputs come from two
places: the **AI** (Gemini Vision grading the image) supplies `severity` and
`isEmergency`; the **report context** supplies `trafficLevel`, `peopleAffected`,
`schoolNearby`, and `hospitalNearby`.

| Signal | Source | Range / values |
|--------|--------|----------------|
| `severity` | AI (Gemini Vision) | LOW / MEDIUM / HIGH / CRITICAL |
| `isEmergency` | AI (Gemini Vision) | true / false |
| `trafficLevel` | report context | 0–5 |
| `peopleAffected` | report context | count (capped at 500) |
| `schoolNearby` | report context | true / false |
| `hospitalNearby` | report context | true / false |

**1. Emergency short-circuit** — if `isEmergency` is true, the score is forced to
**100 / CRITICAL** regardless of the other signals.

**2. Otherwise**, each signal becomes a multiplier so they compound:

```
severityWeight   = { LOW:1, MEDIUM:2, HIGH:3, CRITICAL:4 }
trafficFactor    = 1 + min(trafficLevel,5)/5        // 1.0 – 2.0
peopleFactor     = 1 + min(peopleAffected,500)/500  // 1.0 – 2.0
schoolFactor     = schoolNearby   ? 1.25 : 1
hospitalFactor   = hospitalNearby ? 1.35 : 1

rawScore = severityWeight * 6.25 * trafficFactor * peopleFactor
                          * schoolFactor * hospitalFactor
score    = round(min(rawScore, 100), 2)

level: score ≥ 75 → CRITICAL
       score ≥ 50 → HIGH
       score ≥ 25 → MEDIUM
       else       → LOW
```

The constant `6.25` (= 100 ⁄ 16) calibrates severity alone to a 6.25–25 baseline;
the multipliers then scale toward the 100 ceiling. A nearby hospital (×1.35)
weighs slightly more than a school (×1.25), and traffic or crowd size can each
double the score at their maximum.

**Worked examples**

- *Exposed live wire* → `isEmergency = true` → **100 / CRITICAL** (short-circuit).
- *Pothole on a busy road near a school* — HIGH severity, traffic 4/5, 200 people,
  school nearby: `3 × 6.25 × 1.8 × 1.4 × 1.25 = 59.06` → **HIGH**.
- *Faded road paint on a quiet street* — LOW severity, no traffic, no crowd:
  `1 × 6.25 = 6.25` → **LOW**.

### Duplicate detection

`duplicate.service.js → findDuplicates()`

A candidate is treated as a duplicate only when **all three** conditions hold:

1. **Same category** — the AI-assigned `category` matches.
2. **Still open** — status is one of `REPORTED`, `VERIFIED`, `ASSIGNED`,
   `ENGINEER_VISITED`, `REPAIR_STARTED` (completed/rejected issues never count).
3. **Within the radius** — default **100 m** (`DEFAULT_RADIUS_M`).

Detection runs in two stages for performance:

- **Bounding-box prefilter (DB).** A degrees-per-meter box limits the scan:
  ```
  latDelta = radiusMeters / 111000
  lngDelta = radiusMeters / (111000 * cos(latitude))   // longitude shrinks toward the poles
  ```
  Only same-category, open issues whose `latitude`/`longitude` fall inside the
  box are fetched.
- **Exact Haversine distance (code).** Each candidate is measured with the
  great-circle formula (`distanceMeters()`, `R = 6,371,000 m`); anything beyond
  the radius is filtered out and the rest are **sorted nearest-first**.

On a match, `POST /api/issues` returns **409** with the nearest issue and its
distance (see the 409 body above). The citizen can `POST /issues/:id/support`
the existing report, or resend with `forceCreate=true` to file a separate one.

### Graceful fallbacks

When `GEMINI_API_KEY` is missing, AI calls return safe defaults
(category `OTHER`, severity `MEDIUM`, the raw text as summary). When Cloudinary
keys are missing, media upload is skipped and the issue is still created.

---

## 5. Feature Mapping

| # | Feature | Implementation |
|---|---------|----------------|
| 1 | Smart Image Understanding | `gemini.service.js → analyzeIssueImage()` |
| 2 | Duplicate Detection | `duplicate.service.js`; 409 response + `/support` |
| 3 | Auto Priority | `priority.service.js → computePriority()` |
| 4 | AI Summary | `gemini.service.js → summarizeDescription()` |
| 5 | Department Routing | `suggestDepartment()` + `Department` model |
| 6 | AI Chat Assistant | `chat.controller.js` + `chatReply()` |
| 7 | Geo Mapping | Issue `lat/lng` + `GET /issues/map` |
| 8 | Community Verification | `verification.controller.js` (auto-verify at 3 YES) |
| 9 | Impact Dashboard | `dashboard.controller.js → getStats()` |
| 10 | Predictive AI | `getPrediction()` + `predictHotspot()` |
| 11 | Voice Reporting | `voice.controller.js` + `transcribeAudio()` |
| 12 | Emergency Detection | `isEmergency` from image analysis → CRITICAL |
| 13 | Progress Timeline | `TimelineEvent` model + status updates |

---

## 6. API Reference

Base URL: `http://localhost:5000`
All API routes are prefixed with `/api`. Health check is at `/health`.

### Conventions

Success envelope:
```json
{ "success": true, "message": "OK", "data": { } }
```
Paginated envelope adds:
```json
{ "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }
```
Error envelope:
```json
{ "success": false, "message": "Reason", "details": [ ] }
```

### Auth

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | — | `name, email, password, latitude?, longitude?` | Register a citizen; returns `{ user, token }` |
| POST | `/api/auth/login` | — | `email, password` | Returns `{ user, token }` |
| GET | `/api/auth/me` | Bearer | — | Current user |

### Issues

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/issues` | Bearer | Report an issue (multipart). Runs full AI pipeline |
| GET | `/api/issues` | optional | List/filter issues (paginated) |
| GET | `/api/issues/map` | — | Lightweight markers for the map |
| GET | `/api/issues/:id` | — | Detail + timeline |
| PATCH | `/api/issues/:id/status` | Officer/Admin | Update status, append timeline event |
| POST | `/api/issues/:id/vote` | Bearer | Toggle upvote |
| POST | `/api/issues/:id/support` | Bearer | Back an existing issue (duplicate flow) |
| POST | `/api/issues/:id/verify` | Bearer | Community verification (`YES`/`NO`) |
| GET | `/api/issues/:id/verifications` | — | Verification tally |

**`POST /api/issues`** — `multipart/form-data`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | yes | 3–140 chars |
| description | string | yes | raw complaint text |
| latitude | number | yes | −90…90 |
| longitude | number | yes | −180…180 |
| address | string | no | |
| category | string | no | citizen hint; AI may override |
| trafficLevel | number | no | 0–5 |
| peopleAffected | number | no | |
| schoolNearby | boolean | no | |
| hospitalNearby | boolean | no | |
| forceCreate | boolean | no | skip duplicate short-circuit |
| images | file[] | no | up to 5 images/videos |

If a duplicate is found, responds **409**:
```json
{
  "success": false,
  "message": "A similar issue already exists nearby...",
  "duplicate": { "issue": { }, "distanceMeters": 23 },
  "hint": "Resend with forceCreate=true, or POST /api/issues/:id/support."
}
```

**`GET /api/issues`** query params: `page`, `limit` (max 100), `category`,
`status`, `priority`, `departmentId`, `mine=true` (requires auth).
Sorted by `priorityScore desc, createdAt desc`.

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Totals, resolved %, avg resolution hours, most common issue, category & department breakdown |
| GET | `/api/dashboard/hotspots` | Open issues bucketed into a ~1 km geo grid |
| GET | `/api/dashboard/predict` | AI prediction over the 20 most recent open issues |

### Chat (Feature 6)

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/api/chat` | Bearer | `message, issueId?` | AI reply, grounded in issue context if `issueId` given; persists both turns |
| GET | `/api/chat/history` | Bearer | — | Last 100 messages for the user |

### Voice (Feature 11)

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/api/voice/transcribe` | Bearer | multipart `audio` | Transcribe + extract `{ transcript, category, summary }` |

### Departments (Feature 5)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List departments with issue counts |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | `{ status, uptime, integrations: { gemini, cloudinary } }` |

---

## 7. Authentication & Authorization

- **JWT** issued on register/login. Send as `Authorization: Bearer <token>`.
- Token payload: `{ sub: userId, role }`. Expiry from `JWT_EXPIRES_IN` (default `7d`).
- Middleware (`src/middleware/auth.js`):
  - `authenticate` — requires a valid token, attaches `req.user`.
  - `authorize(...roles)` — restricts to roles (e.g. `OFFICER`, `ADMIN`).
  - `optionalAuth` — attaches `req.user` if present, never blocks.
- **Roles:** `CITIZEN` (report, vote, support, verify, chat),
  `OFFICER`/`ADMIN` (additionally update issue status).

---

## 8. Configuration

Environment variables (see `.env.example`):

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| NODE_ENV | no | development | Environment mode |
| PORT | no | 5000 | HTTP port |
| CLIENT_URL | no | http://localhost:5173 | CORS origin(s), comma-separated |
| DATABASE_URL | **yes** | — | PostgreSQL connection string |
| JWT_SECRET | **yes** | dev fallback | JWT signing secret |
| JWT_EXPIRES_IN | no | 7d | Token lifetime |
| CLOUDINARY_CLOUD_NAME | for uploads | — | Cloudinary |
| CLOUDINARY_API_KEY | for uploads | — | Cloudinary |
| CLOUDINARY_API_SECRET | for uploads | — | Cloudinary |
| GEMINI_API_KEY | for AI | — | Google AI Studio key |
| GEMINI_MODEL | no | gemini-2.5-flash | Text model |
| GEMINI_VISION_MODEL | no | gemini-2.5-flash | Vision model |

Missing optional integrations only trigger a warning; the API still boots.

---

## 9. Setup & Running

**Prerequisites:** Node.js 22+, PostgreSQL, npm.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in DATABASE_URL, JWT_SECRET, Cloudinary & Gemini keys

# 3. Generate Prisma client
npm run prisma:generate

# 4. Create the database schema
npm run prisma:migrate          # prisma migrate dev

# 5. Seed default departments + demo admin
npm run prisma:seed

# 6. Run
npm run dev                      # watch mode
# or
npm start
```

Demo admin (from seed): `admin@communityhero.dev` / `admin1234`.

**npm scripts**

| Script | Action |
|--------|--------|
| `npm start` | Run the server |
| `npm run dev` | Run with `--watch` reload |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:seed` | Seed departments + admin |
| `npm run db:push` | Push schema without a migration |

---

## 10. Conventions & Error Handling

- **Validation:** request bodies validated with **zod**; failures return
  `400` with a `details` array of `{ path, message }`.
- **Async errors:** controllers wrapped in `asyncHandler` so rejections reach
  the global handler.
- **ApiError:** throw `ApiError.badRequest()`, `.unauthorized()`, `.forbidden()`,
  `.notFound()`, `.conflict()`, `.internal()` for explicit HTTP statuses.
- **Prisma errors** mapped in `errorHandler.js`: `P2002` → 409 (unique),
  `P2025` → 404 (not found).
- **Stack traces** included in responses only when `NODE_ENV !== production`.

---

## 11. Security Notes

- **Public read endpoints:** `GET /issues`, `/issues/map`, `/issues/:id`,
  `/issues/:id/verifications`, `/dashboard/*`, and `/departments` are
  **unauthenticated** by design (civic transparency). To lock them down, add
  the `authenticate` middleware to those routes.
- **Rate limiting:** 300 requests / 15 min per IP on `/api` (`express-rate-limit`).
- **Headers:** `helmet` applied globally.
- **Passwords:** hashed with bcrypt (cost 10); never returned in responses.
- **Uploads:** in-memory (multer), max 15 MB per file, MIME-filtered to common
  image/video types, streamed directly to Cloudinary (no disk writes).
- **Secrets:** keep `.env` out of version control (already in `.gitignore`).
  Replace the default `JWT_SECRET` before any non-local deployment.
