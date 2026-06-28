# Community Hero (Cityguardian)
### An AI-powered civic engagement platform that closes the loop between citizens and local authorities.

> **One-line pitch:** Snap a photo of a civic problem — a pothole, a leaking pipe, a broken streetlight — and our AI classifies it, scores its urgency, routes it to the right department, and tracks it through to resolution, while the community verifies it in real time.

---

## 1. The Problem

Every city runs on a broken feedback loop:

- **Citizens don't know where to report.** Complaints are scattered across phone lines, paper forms, and disconnected apps.
- **Duplicate reports flood the system.** Ten people report the same pothole; authorities see ten "issues" instead of one with strong community backing.
- **No prioritization.** A dangerous open manhole near a school sits in the same queue as a cosmetic complaint.
- **Zero transparency.** Once reported, a citizen never hears back. Trust erodes. People stop reporting.
- **Manual triage is slow and expensive.** Officials spend hours reading, categorizing, and routing complaints by hand.

The result: civic issues that could be fixed in days take months, and citizens disengage entirely.

---

## 2. Our Solution

**Community Hero** turns a single photo into a fully triaged, routed, and tracked civic report — in seconds — using a multi-stage AI pipeline, and then keeps everyone accountable through community verification and a transparent timeline.

```
Citizen → Upload image / voice / text
        → Gemini Vision (what is it? how severe? what's the safety risk?)
        → AI Agent (duplicate? nearest existing report? which department? what priority?)
        → Dashboard → Community votes & verification → Issue resolved
```

We deliberately split the experience into two products that share one backend:

- **Citizen App** — report issues, explore a live map, verify neighbors' reports, and climb a civic leaderboard.
- **Admin Console** — triage incoming reports, route to departments, manage users, and audit every action.

---

## 3. What Makes Us Different (Judge's Cheat-Sheet)

| Most hackathon "civic apps" | Community Hero |
|---|---|
| A form that emails a complaint | A **multi-stage AI pipeline**: vision → classification → priority scoring → department routing |
| Treat every report as unique | **Geo-aware duplicate detection** (Haversine, ~100 m) so users *support* an issue instead of flooding it |
| Flat "open/closed" status | A full **lifecycle timeline**: Reported → Verified → Assigned → Engineer Visited → Repair Started → Completed |
| Trust the reporter blindly | **Location-gated community verification** that auto-promotes genuine reports |
| Hard-coded to one AI vendor | A **provider-agnostic AI layer** (Gemini ↔ Cloudflare Workers AI) with graceful fallbacks |
| Text only | **Image + Voice + Text** intake, including emergency auto-escalation |

This is not a prototype that fakes the AI — the full pipeline runs end to end.

---

## 4. Core Features

1. **Smart Image Understanding** — Gemini Vision detects the issue category, severity, safety risk, and even estimates the physical size of the problem from a single photo.
2. **Duplicate Detection** — Nearby reports of the same category are detected so users reinforce an existing issue instead of creating noise.
3. **Auto Priority Scoring** — A weighted model (severity + traffic + people affected + proximity to schools/hospitals) yields a LOW → CRITICAL priority.
4. **AI Summary** — Rough, messy citizen text is rewritten into a clear, structured summary for officials.
5. **Automatic Department Routing** — Issues are sent to the correct department (Road Maintenance, Water Supply, Sanitation, etc.) without manual triage.
6. **AI Chat Assistant** — A civic assistant answers questions about status, processes, and timelines.
7. **Geo Mapping** — Interactive map with status-coded markers (resolved / in-progress / critical) and automatic hotspot detection.
8. **Community Verification** — Location-gated confirmations; enough confirmations auto-promote a report to *Verified*.
9. **Impact Dashboard** — Total complaints, resolution rate, average resolution time, common issues, hotspots, and department performance.
10. **Predictive Insights** — AI surfaces likely near-future risks from clustered reports.
11. **Voice Reporting** — Spoken reports are transcribed and structured into form fields for low-literacy and on-the-go users.
12. **Emergency Detection** — Immediate dangers (live wires, structural collapse) are flagged and escalated to CRITICAL automatically.
13. **Progress Timeline** — Every report carries a complete, transparent lifecycle trail.
14. **Secure Admin Access** — Admin sign-in is protected by **email OTP two-factor authentication**.

---

## 5. Under the Hood: Priority Scoring & Duplicate Detection

### Priority Scoring

Every report receives a **priority score (0–100)** and a discrete **level** (LOW → CRITICAL). The score fuses what the AI *sees* in the image with on-the-ground context, so no single factor can dominate.

**Inputs**

- From the AI (Gemini Vision grading the photo): `severity` (LOW/MEDIUM/HIGH/CRITICAL) and `isEmergency` (true/false for live wires, collapse, etc.).
- From the report context: `trafficLevel` (0–5), `peopleAffected` (count), `schoolNearby`, `hospitalNearby`.

**The formula**

1. **Emergency short-circuit.** If the AI flags an emergency, the score is forced to **100 / CRITICAL** — public-safety dangers always jump the queue.
2. Otherwise, each signal becomes a **multiplier** so factors compound instead of any one overpowering the rest:

```
severityWeight = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }

trafficFactor   = 1 + min(trafficLevel, 5) / 5         ->  1.0 - 2.0
peopleFactor    = 1 + min(peopleAffected, 500) / 500   ->  1.0 - 2.0
schoolFactor    = schoolNearby   ? 1.25 : 1.0
hospitalFactor  = hospitalNearby ? 1.35 : 1.0

raw   = severityWeight * 6.25 * trafficFactor * peopleFactor * schoolFactor * hospitalFactor
score = round( min(raw, 100), 2 )
```

The constant `6.25` (= 100 / 16) calibrates severity alone to a 6.25–25 baseline; the multipliers scale it up toward the 100 ceiling. A nearby hospital (×1.35) weighs slightly more than a school (×1.25); traffic and crowd size can each *double* the score at maximum.

3. **Level bands:** ≥ 75 = CRITICAL · 50–74.99 = HIGH · 25–49.99 = MEDIUM · < 25 = LOW.

**Worked examples**

- *Exposed live wire* → `isEmergency = true` → **100 / CRITICAL** (short-circuit).
- *Large pothole on a busy road near a school* — HIGH severity, traffic 4/5, 200 people, school nearby: `3 × 6.25 × 1.8 × 1.4 × 1.25 = 59.06` → **HIGH**.
- *Faded road paint on a quiet street* — LOW severity, no traffic, no crowd: `1 × 6.25 = 6.25` → **LOW**.

Implementation: `Backend/src/services/priority.service.js` (`computePriority`), invoked by the report pipeline after the Gemini Vision analysis.

### Duplicate Detection

When a citizen submits a report, the platform checks whether the same problem was *already* reported nearby — so ten people reporting one pothole reinforce a single issue instead of creating ten tickets. A candidate counts as a duplicate only when **all three** hold:

1. **Same category** — the AI-assigned category (e.g. `POTHOLE`) matches.
2. **Still open** — the existing issue is active (`REPORTED`, `VERIFIED`, `ASSIGNED`, `ENGINEER_VISITED`, `REPAIR_STARTED`); completed/rejected issues never count.
3. **Within ~100 m** — by true geographic distance.

Detection runs in two stages for speed:

- **Bounding-box prefilter (in the database).** A small lat/lng box limits how many rows are read — `latDelta = radius / 111000` and `lngDelta = radius / (111000 × cos(latitude))`, since longitude shrinks toward the poles. Only same-category, open issues inside the box are fetched.
- **Exact Haversine distance (in code).** Each candidate is measured with the Haversine great-circle formula (`R = 6,371,000 m`); anything beyond the radius is dropped and the rest are sorted nearest-first.

On a match, `POST /issues` does not create a new record — it returns **HTTP 409** with the nearest issue and its distance. The citizen can **support** it (`POST /issues/:id/support`) or **force-create** a separate report with `forceCreate=true`.

Implementation: `Backend/src/services/duplicate.service.js` (`findDuplicates`, `distanceMeters`).

---

## 6. Live Demo Flow (for the pitch)

1. **Report in 10 seconds** — On a phone, take a photo of a pothole. Watch the AI instantly fill in category, severity, and a clean summary.
2. **Duplicate magic** — Try reporting the same pothole again from a nearby location. The app detects it and offers to *support* the existing report instead.
3. **Priority in action** — Report something near a school. Watch the priority jump to CRITICAL.
4. **Community trust** — Switch to another account and verify the report; see it auto-promote to *Verified*.
5. **Admin's view** — Open the Admin Console: the issue is already routed to the right department with a priority score. Move it through the lifecycle and watch the citizen's timeline update.
6. **Insights** — Show the Impact Dashboard: resolution rate, hotspots, and department performance — the data city officials actually need.

---

## 7. Technical Architecture

**Frontend**
- React 19 + Vite + TypeScript
- Tailwind CSS v4 with a shadcn/ui component library
- React Router, Leaflet & Google Maps, Recharts, Framer Motion

**Backend**
- Node.js + Express (ESM), layered as `routes → controllers → services → data (Prisma)`
- Prisma ORM + PostgreSQL
- JWT authentication (access + refresh tokens) with silent refresh
- Cloudinary (image/video storage), Nodemailer (transactional email + OTP)

**AI**
- Google Gemini 2.5 Flash + Gemini Vision
- A single **provider-agnostic facade** (`services/ai.service.js`) so switching to Cloudflare Workers AI is a one-line environment change, with graceful fallbacks when no key is configured

**Engineering highlights judges care about**
- Clean layered architecture with a dedicated admin module (`controller → service → repository`).
- A typed API client that unwraps a standard `{ success, message, data }` envelope, injects the bearer token, and silently refreshes expired sessions.
- CI/CD via GitHub Actions: schema validation, lint, type-check, and build on every push; gated auto-deploy to Render (backend) and Vercel (frontend).
- Security-first: hashed passwords (bcrypt), hashed password-reset tokens, OTP-based admin 2FA, role-gated routes.

---

## 8. Impact & Why It Matters

- **For citizens:** Reporting takes seconds, and they finally see what happens next — restoring trust in local government.
- **For authorities:** AI eliminates manual triage, deduplicates noise, and surfaces the most urgent and dangerous issues first.
- **For cities:** Data-driven insight into hotspots, recurring problems, and department performance — turning reactive maintenance into proactive planning.

**Measurable outcomes we enable:** faster resolution times, fewer duplicate tickets, better allocation of limited municipal resources, and higher citizen participation.

---

## 9. Scalability & Future Scope

- **Multi-language + voice-first** flows for inclusive, low-literacy access.
- **WhatsApp / SMS intake** so anyone can report without installing an app.
- **Predictive maintenance** — forecast infrastructure failures from clustered historical reports.
- **Government API integrations** to push verified issues directly into existing municipal ticketing systems.
- **Gamified civic rewards** — partner with local businesses to reward top community heroes.
- **Offline-first PWA** for areas with poor connectivity.

---

## 10. Team & Links

- **Live Demo:** _add your deployed URL here_
- **GitHub Repository:** _add your repo URL here_
- **Demo Video:** _add your video link here_
- **Team:** _add team member names and roles here_

> **Tagline:** *Your city. Your voice. Your responsibility.*

---

### Try it (demo credentials)
A seeded demo admin is available for evaluation:
```
email:    test@cityguardian.tech
password: Test@1234
```
_(Admin sign-in then sends a one-time code to the account email for 2FA.)_
