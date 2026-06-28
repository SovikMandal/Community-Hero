# Community Hero

> An AI-powered civic engagement platform that helps citizens report, validate, track, and resolve community issues — potholes, water leakage, garbage overflow, broken streetlights, and more.

Community Hero closes the loop between citizens and local authorities. A resident photographs a problem; Google Gemini analyzes the image, classifies it, scores its priority, and routes it to the right department; the community verifies it; and everyone tracks it through a transparent timeline until it is resolved.

[![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/ci.yml)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Overview](#api-overview)
- [CI/CD](#cicd)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

People often don't know where to report civic problems, file duplicate complaints, and have no way to track progress. Community Hero solves this with an end-to-end, AI-assisted workflow:

```
Citizen → Upload image / voice / text
        → Gemini Vision (what, how severe, location, safety risk)
        → AI Agent (duplicate? nearest report? department? priority?)
        → Dashboard → Community votes & verification → Issue resolved
```

The platform separates two experiences: a **citizen app** (report, explore the map, verify reports, climb the leaderboard) and an **admin console** (triage reports, route to departments, manage users, audit actions).

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

## Tech Stack

**Frontend**
- React 19 + Vite + TypeScript
- Tailwind CSS v4 with a shadcn/ui component library
- React Router, Leaflet & Google Maps, Recharts, Framer Motion

**Backend**
- Node.js + Express (ESM)
- Prisma ORM + PostgreSQL
- JWT authentication (access + refresh tokens)
- Cloudinary (image/video storage), Nodemailer (transactional email)

**AI**
- Google Gemini 2.5 Flash + Gemini Vision
- Pluggable provider layer with a Cloudflare Workers AI alternative

## Architecture

The backend follows a layered design — `routes → controllers → services → data (Prisma)` — with a dedicated admin module using a `controller → service → repository` split. All AI features are accessed through a single provider-agnostic facade (`services/ai.service.js`), so switching from Gemini to Cloudflare is a one-line environment change with graceful fallbacks when no key is configured.

The frontend talks to the API through a typed client (`src/lib/`) that unwraps the standard `{ success, message, data }` envelope, injects the bearer token, and silently refreshes expired access tokens.

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
> Change or remove this account before any public deployment.

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

## License

Released under the MIT License.
