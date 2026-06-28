<div align="center">

# 🛡️ Community Hero · *Cityguardian*

### An AI-powered civic engagement platform that helps citizens report, validate, track, and resolve community issues — potholes, water leakage, garbage overflow, broken streetlights, and more.

**Your city. Your voice. Your responsibility.**

<br/>

![Node](https://img.shields.io/badge/Node-20%2B-339933?logo=node.js&logoColor=white) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white) ![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white) ![Gemini](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-8E75FF?logo=googlegemini&logoColor=white) ![License](https://img.shields.io/badge/License-MIT-green.svg)

</div>

---

> **Snap a photo of a civic problem → our AI classifies it, scores its urgency, routes it to the right department, and tracks it to resolution — while the community verifies it in real time.**

Community Hero closes the loop between citizens and local authorities. A resident photographs a problem; Google Gemini analyzes the image, classifies it, scores its priority, and routes it to the right department; the community verifies it; and everyone tracks it through a transparent timeline until it is resolved.

---

## Table of Contents

- [Demo & Links](#demo--links)
- [Why Community Hero](#why-community-hero)
- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [How the AI Calculates Priority](#how-the-ai-calculates-priority)
- [How Duplicate Detection Works](#how-duplicate-detection-works)
- [Security](#security)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [License](#license)

---

## Demo & Links

| | |
|---|---|
| 🚀 **Live Demo** | _add your deployed URL_ |
| 🎬 **Demo Video** | _add your video link_ |
| 💻 **Source Code** | _add your repository URL_ |
| 👥 **Team** | _add team members & roles_ |

> **Try it instantly** with the seeded demo admin (admin sign-in is protected by an emailed one-time code):
> ```
> email:    test@cityguardian.tech
> password: Test@1234
> ```

---

## Why Community Hero

Every city runs on a broken feedback loop: citizens don't know where to report, file duplicate complaints, and never hear back. Most "civic apps" are just a form that emails a complaint. We're different:

| Typical civic app | Community Hero |
|---|---|
| A form that emails a complaint | A **multi-stage AI pipeline**: vision → classification → priority scoring → department routing |
| Treats every report as unique | **Geo-aware duplicate detection** (~100 m) so users *support* an issue instead of flooding it |
| Flat *open / closed* status | A full **lifecycle timeline**: Reported → Verified → Assigned → Engineer Visited → Repair Started → Completed |
| Trusts the reporter blindly | **Location-gated community verification** that auto-promotes genuine reports |
| Hard-coded to one AI vendor | A **provider-agnostic AI layer** (Gemini ↔ Cloudflare) with graceful fallbacks |
| Text only | **Image + Voice + Text** intake, with emergency auto-escalation |

The full AI pipeline runs end to end — not mocked.

---

## Overview

People often don't know where to report civic problems, file duplicate complaints, and have no way to track progress. Community Hero solves this with an end-to-end, AI-assisted workflow:

```
Citizen → Upload image / voice / text
        → Gemini Vision (what, how severe, location, safety risk)
        → AI Agent (duplicate? nearest report? department? priority?)
        → Dashboard → Community votes & verification → Issue resolved
```

The platform separates two experiences that share one backend: a **citizen app** (report, explore the map, verify reports, climb the leaderboard) and an **admin console** (triage reports, route to departments, manage users, audit actions).

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Smart Image Understanding** | Gemini Vision detects the issue category, severity, risk, and estimated size from a photo. |
| 2 | **Duplicate Detection** | Nearby reports of the same category are detected (Haversine, ~100 m) so users *support* an existing issue instead of filing duplicates. |
| 3 | **Auto Priority** | A weighted score from severity, traffic, people affected, and proximity to schools/hospitals yields a LOW→CRITICAL priority. |
| 4 | **AI Summary** | Rough citizen text is rewritten into a clear, structured summary. |
| 5 | **Department Routing** | Issues are automatically routed to the correct department (Road Maintenance, Water Supply, Sanitation, etc.). |
| 6 | **AI Chat Assistant** | A civic assistant answers questions about issue status, processes, and timelines. |
| 7 | **Geo Mapping** | Interactive map with status-coded markers (resolved / in-progress / critical). |
| 8 | **Community Verification** | Location-gated confirmations; enough confirmations auto-promote a report to *Verified*. |
| 9 | **Impact Dashboard** | Total complaints, resolution rate, average resolution time, common issues, hotspots, and department performance. |
| 10 | **Predictive Insights** | AI surfaces likely near-future risks from clustered reports. |
| 11 | **Voice Reporting** | Spoken reports are transcribed and structured into form fields. |
| 12 | **Emergency Detection** | Immediate dangers (live wires, collapse) are flagged and escalated to CRITICAL. |
| 13 | **Progress Timeline** | Every report carries a full lifecycle trail: Reported → Verified → Assigned → Engineer Visited → Repair Started → Completed. |
| 14 | **Secure Admin 2FA** | Admin sign-in is protected by email one-time-password (OTP) two-factor authentication. |

## Screenshots

> _Drop your screenshots/GIFs into `docs/` (or `Frontend/src/assets/`) and link them here — a strong visual row dramatically improves first impressions._

| Landing | Report (AI analysis) | Live Map |
|---|---|---|
| _screenshot_ | _screenshot_ | _screenshot_ |

| Community Verification | Impact Dashboard | Admin Console |
|---|---|---|
| _screenshot_ | _screenshot_ | _screenshot_ |

## Tech Stack

**Frontend**
- React 19 + Vite 8 + TypeScript
- Tailwind CSS v4 with shadcn/ui, Radix UI & MUI primitives
- React Router, Leaflet & Google Maps, Recharts, Framer Motion (`motion`)

**Backend**
- Node.js 20+ + Express 4 (ESM)
- Prisma 6 ORM + PostgreSQL (Neon serverless driver)
- JWT authentication (access + refresh tokens)
- Helmet, CORS, and express-rate-limit hardening
- Cloudinary (image/video storage), Nodemailer (transactional email + OTP)
- Zod request validation

**AI**
- Google Gemini 2.5 Flash + Gemini Vision
- Pluggable provider layer with a Cloudflare Workers AI alternative

## Architecture

The backend follows a layered design — `routes → controllers → services → data (Prisma)` — with a dedicated admin module using a `controller → service → repository` split. All AI features are accessed through a single provider-agnostic facade (`services/ai.service.js`), so switching from Gemini to Cloudflare is a one-line environment change with graceful fallbacks when no key is configured.

The frontend talks to the API through a typed client (`src/lib/`) that unwraps the standard `{ success, message, data }` envelope, injects the bearer token, and silently refreshes expired access tokens.

## How the AI Calculates Priority

Every report receives a **priority score (0–100)** and a discrete **level** (LOW → CRITICAL). The score fuses what the AI *sees* in the image with on-the-ground context signals, so no single factor can dominate the outcome.

### Inputs

| Signal | Source | Range |
|--------|--------|-------|
| `severity` | **AI** — Gemini Vision grades the photo | LOW / MEDIUM / HIGH / CRITICAL |
| `isEmergency` | **AI** — Gemini flags immediate danger (live wires, collapse) | true / false |
| `trafficLevel` | Report context | 0–5 |
| `peopleAffected` | Report context | raw count (capped at 500) |
| `schoolNearby` | Report context | true / false |
| `hospitalNearby` | Report context | true / false |

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

**2. Otherwise**, each signal becomes a **multiplier**, so factors compound instead of any one overpowering the rest:

```
severityWeight = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }

trafficFactor   = 1 + min(trafficLevel, 5) / 5        →  1.0 – 2.0
peopleFactor    = 1 + min(peopleAffected, 500) / 500  →  1.0 – 2.0
schoolFactor    = schoolNearby   ? 1.25 : 1.0
hospitalFactor  = hospitalNearby ? 1.35 : 1.0

raw   = severityWeight × 6.25 × trafficFactor × peopleFactor × schoolFactor × hospitalFactor
score = round( min(raw, 100), 2 )
```

The constant `6.25` (= 100 ⁄ 16) calibrates severity alone to a 6.25–25 baseline; the multipliers then scale it up toward the 100 ceiling. A hospital nearby (×1.35) weighs slightly more than a school (×1.25), and both traffic and crowd size can each *double* the score at their maximum.

**3. Level bands:**

| Score | Level |
|-------|-------|
| ≥ 75 | CRITICAL |
| 50 – 74.99 | HIGH |
| 25 – 49.99 | MEDIUM |
| < 25 | LOW |

### Worked examples

- **Exposed live wire** → AI sets `isEmergency = true` → **100 / CRITICAL** (short-circuit).
- **Large pothole on a busy road near a school** — severity HIGH, traffic 4/5, 200 people, school nearby:
  `3 × 6.25 × 1.8 × 1.4 × 1.25 × 1.0 = 59.06` → **HIGH**.
- **Faded road paint on a quiet street** — severity LOW, no traffic, no crowd:
  `1 × 6.25 × 1.0 × 1.0 × 1.0 × 1.0 = 6.25` → **LOW**.

> Implementation: [`Backend/src/services/priority.service.js`](Backend/src/services/priority.service.js) (`computePriority`), invoked by the report pipeline in `issue.controller.js` after the Gemini Vision analysis.

## How Duplicate Detection Works

When a citizen submits a report, the platform checks whether the same problem has *already* been reported nearby — so ten people reporting one pothole reinforce a single issue instead of creating ten tickets.

A candidate is treated as a duplicate only when **all three** conditions hold:

1. **Same category** — the AI-assigned category (e.g. `POTHOLE`) must match.
2. **Still open** — the existing issue is in an active state (`REPORTED`, `VERIFIED`, `ASSIGNED`, `ENGINEER_VISITED`, or `REPAIR_STARTED`). Completed/rejected issues never count.
3. **Within ~100 m** — measured by true geographic distance.

### How the distance is computed

A naive scan of every issue would be slow, so detection runs in two stages:

**1. Bounding-box prefilter (fast, in the database).** A small lat/lng box around the new report limits how many rows are read:

```
latDelta = radiusMeters / 111000
lngDelta = radiusMeters / (111000 × cos(latitude))   // longitude shrinks toward the poles
```

The query fetches only same-category, open issues whose coordinates fall inside that box.

**2. Exact Haversine distance (precise, in code).** Each candidate from the box is measured with the Haversine great-circle formula, which accounts for the Earth's curvature:

```
a = sin²(Δlat / 2) + cos(lat₁) · cos(lat₂) · sin²(Δlng / 2)
distance = 2 · R · atan2(√a, √(1 − a))        // R = 6 371 000 m
```

Candidates farther than the radius are dropped; the rest are **sorted nearest-first**.

### What happens on a match

If a duplicate is found, `POST /issues` does **not** create a new record — it returns **HTTP 409** with the nearest existing issue and its distance in meters. The citizen can then:

- **Support** the existing report (`POST /issues/:id/support`) — adding their weight to it, or
- **Force-create** a genuinely separate report by resending with `forceCreate=true`.

> Implementation: [`Backend/src/services/duplicate.service.js`](Backend/src/services/duplicate.service.js) (`findDuplicates`, `distanceMeters`), invoked by `issue.controller.js` before the issue is persisted.

## Security

Security is built in, not bolted on:

- **Password hashing** with bcrypt; password-reset tokens are stored only as SHA-256 hashes with a 30-minute expiry.
- **Admin two-factor login** — admins authenticate with email + password, then must confirm a 6-digit OTP emailed to them before any session token is issued.
- **JWT access + refresh tokens** with server-side refresh-token revocation on logout and password change.
- **Role-gated routes** — the admin area requires a real `ADMIN` role issued by the backend; non-admins are rejected and their session cleared.
- **Google OAuth 2.0** authorization-code flow with an anti-CSRF state cookie; tokens are returned via URL hash, never logged.
- **HTTP hardening** via Helmet, configurable CORS origins, and rate limiting.

## Repository Structure

```
Community Issue Reporting Platform/
├── Backend/                  # Express + Prisma API
│   ├── prisma/               # schema.prisma, migrations, seed
│   └── src/
│       ├── config/           # prisma, gemini, cloudflare, cloudinary, env
│       ├── middleware/       # auth, upload (multer), error handling
│       ├── services/         # AI, priority, duplicate, leaderboard, otp
│       ├── controllers/      # issue, auth, dashboard, community, chat, ...
│       ├── routes/           # API route definitions
│       ├── admin/            # admin module (routes/controller/service/repository)
│       ├── app.js            # Express app (security, parsing, routes)
│       └── server.js         # HTTP entry point + graceful shutdown
├── Frontend/                 # React + Vite client
│   └── src/
│       ├── lib/              # typed API client, auth, types, endpoints
│       ├── pages/            # landing, auth, dashboard, report, explore, ...
│       ├── admin/            # admin console (layout, pages, components)
│       └── components/       # shared UI + shadcn/ui primitives
└── .github/workflows/        # CI/CD pipelines
```

## Getting Started

### Prerequisites
- **Node.js 20+**
- **PostgreSQL** database (local or hosted, e.g. Neon)
- API keys as needed: Google Gemini (or Cloudflare Workers AI), Cloudinary, Google Maps, and an SMTP provider (e.g. Brevo)

### 1. Clone
```bash
git clone <your-repo-url>
cd "Community Issue Reporting Platform"
```

### 2. Backend
```bash
cd Backend
npm install
cp .env.example .env          # then fill in the values (see below)

npm run prisma:generate       # generate the Prisma client
npm run prisma:migrate        # apply migrations to your database
npm run prisma:seed           # seed departments + a demo admin

npm run dev                   # starts the API on http://localhost:5000
```

The seed creates the routing departments and a demo admin account:

```
email:    admin@communityhero.dev
password: admin1234
```
> Admin sign-in sends a one-time code to the account email, so SMTP must be configured to log in as admin. Change or remove this account before any public deployment.

### 3. Frontend
```bash
cd Frontend
npm install
cp .env.example .env          # add your Google Maps key

npm run dev                   # starts the app on http://localhost:5173
```

The Vite dev server proxies `/api` to the backend at `http://localhost:5000` (override with `VITE_API_TARGET`).

## Environment Variables

### Backend (`Backend/.env`)

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Allowed CORS origin(s) (default `http://localhost:5173`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Access token secret and lifetime |
| `REFRESH_TOKEN_SECRET` / `REFRESH_TOKEN_EXPIRES_IN` | Refresh token secret and lifetime |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Media storage |
| `AI_PROVIDER` | `gemini` or `cloudflare` |
| `GEMINI_API_KEY` / `GEMINI_MODEL` / `GEMINI_VISION_MODEL` | Google Gemini config |
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` | Cloudflare Workers AI (alternative) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | Email (OTP & password reset) |

### Frontend (`Frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key |
| `VITE_API_TARGET` | (Optional) backend URL for the dev proxy |

> Never commit `.env` files. They are git-ignored by default.

## Available Scripts

**Backend**

| Script | Action |
|--------|--------|
| `npm run dev` | Start the API in watch mode |
| `npm start` | Start the API |
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Run dev migrations |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:seed` | Seed departments + demo admin |

**Frontend**

| Script | Action |
|--------|--------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## API Overview

All routes are prefixed with `/api`. Selected endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` · `/auth/login` | Authentication (returns JWT + refresh token) |
| `POST` | `/auth/admin/login` · `/auth/admin/verify` | Admin two-factor sign-in (password → emailed OTP) |
| `GET` | `/auth/google` · `/auth/google/callback` | Google OAuth 2.0 sign-in |
| `GET` | `/auth/me` | Current user |
| `POST` | `/auth/forgot-password` · `/auth/reset-password` | Password reset flow |
| `POST` | `/issues` | Report an issue (runs the full AI pipeline) |
| `POST` | `/issues/analyze` | Preview AI analysis without saving |
| `GET` | `/issues` · `/issues/map` · `/issues/:id` | List, map markers, and detail |
| `POST` | `/issues/:id/vote` · `/issues/:id/support` · `/issues/:id/verify` | Community actions |
| `GET` | `/dashboard/stats` · `/dashboard/hotspots` · `/dashboard/leaderboard` | Impact metrics |
| `POST` | `/chat` | AI chat assistant |
| `POST` | `/voice/transcribe` | Voice report transcription |
| `*` | `/admin/*` | Admin console (issues, departments, users, announcements, audit logs) |

Health check: `GET /health`.

## CI/CD

GitHub Actions workflows live in [`.github/workflows`](.github/workflows):

- **`ci.yml`** — on every push/PR: validates the Prisma schema and syntax-checks the backend, and lints + type-checks + builds the frontend.
- **`deploy.yml`** — after CI passes on `main`, triggers Render (backend) and Vercel (frontend) deploys via deploy hooks. Disabled until the `ENABLE_DEPLOY` repository variable is set to `true`.

See [`.github/workflows/README.md`](.github/workflows/README.md) for the required secrets and one-time platform setup.

## Deployment

- **Frontend → Vercel:** import the repo with root directory `Frontend`, framework Vite, and set `VITE_*` variables.
- **Backend → Render / Cloud Run:** root directory `Backend`, build `npm ci && npx prisma generate`, start `npm start`, and configure all backend environment variables.

Align the runtime to **Node 20+** on both platforms.

## Roadmap

- 🌐 **Multi-language & voice-first** flows for inclusive, low-literacy access.
- 💬 **WhatsApp / SMS intake** so anyone can report without installing an app.
- 🔮 **Predictive maintenance** — forecast infrastructure failures from clustered historical reports.
- 🔗 **Government API integrations** to push verified issues into existing municipal ticketing systems.
- 🏅 **Gamified civic rewards** with local-business partners.
- 📶 **Offline-first PWA** for low-connectivity areas.

## License

Released under the [MIT License](LICENSE).

<div align="center">

**Built for citizens, by citizens. 🛡️**

</div>
