# SVBBS — Smart Vendor Book Bank System

[![CI](https://github.com/Bhanu-0852/svbbs-mern/actions/workflows/ci.yml/badge.svg)](https://github.com/Bhanu-0852/svbbs-mern/actions/workflows/ci.yml)

**Live Demo:** [svbbs-mern.vercel.app](https://svbbs-mern.vercel.app) · **Backend:** [svbbs-mern.onrender.com](https://svbbs-mern.onrender.com)

A circular economy for educational resources. EdTech + FinTech (Knowledge Credits) + GreenTech (Sustainability) + AI.

This repo is being built slice-by-slice (see `/docs` for the full build plan).

## What works right now

**Core platform:** theme system, full production authentication (JWT with refresh rotation, CSRF protection), the Marketplace shelf, the KC Wallet and hybrid-payment Borrow/Return flow, all 9 Government Exam categories, the Academic Passport, real scannable QR codes, Recommendations, all seven role dashboards, route-based code-splitting, Reserve/Waitlist + Notifications, RFID tag tracking, real Deposit/Donate/Sell/Exchange flows, College Scholarship Management + Demand Forecasting, Super Admin Fraud Detection, CSR Sponsored Books, Return reminders, personal Sustainability Impact, Recycler Revenue Tracking, CSR Impact Reports with a real category breakdown, the full Documentation set, a 120-test Vitest suite with CI/CD coverage gating, and a broadly-applied 3D design pass.

**AI features (v2) — every one with a graceful fallback so nothing breaks without an API key:**

- **AI Chatbot with voice** — Web Speech API mic input and spoken replies, answers any question (platform or general knowledge), backed by a Gemini → Groq → smart-fallback cascade so it never goes fully offline even on quota limits
- **AI Photo Book Verification** — upload a real photo of a book and Gemini Vision analyzes its actual condition, giving a score, observations, and a KC recommendation — not a mocked result
- **Natural-language book search** — type "cheap physics books under 100 KC" or "UPSC books in good condition" and the AI parses it into real filters, with a keyword-based fallback parser when AI is unavailable
- **Contextual sidebar AI help** — a "?" button on every sidebar item asks the AI to explain that feature in plain language
- **AI study recommendations** — a personalized "AI Reading Insight" card explains why specific books were recommended based on borrowing history
- **AI book summaries** — generate a quick AI summary of any book before deciding to borrow it
- **AI deposit price helper** — a live, exact KC value estimate while listing a book, computed from the same rules the server uses (and unit-tested to guarantee the two can never drift apart)
- **AI book advisor** — ask "is this book right for me?" on any book page and get an answer grounded in that book's actual details

**Engineering hardening:**

- **120-test Vitest suite**, including dedicated coverage for the AI natural-language parser and a regression guard that keeps the client-side KC estimate mathematically identical to the server's real credit logic
- **CI/CD via GitHub Actions** — syntax-checks every file, runs the full suite with coverage reporting, audits production dependencies for high/critical vulnerabilities, confirms the server boots and the client builds, on every push
- **Dependency-conscious observability** — error tracking implemented as a ~60-line, zero-dependency HTTP reporter rather than pulling in the full Sentry SDK, after discovering it would add 19 vulnerability advisories for OpenTelemetry instrumentation this project never uses
- **Resilient AI cascade** — every AI feature tries Gemini, falls back to Groq, then to deterministic logic or honest static text, so quota limits or missing keys degrade gracefully instead of breaking the feature

## Demo accounts (seeded, pre-verified, with starting KC balances)

| Role | Email | Password | Starting KC |
|---|---|---|---|
| Student | `student@svbbs.demo` | `Demo!Pass123` | 500 |
| Vendor | `vendor@svbbs.demo` | `Demo!Pass123` | 0 |
| Super Admin | `admin@svbbs.demo` | `Demo!Pass123` | 0 |
| Recycler | `recycler@svbbs.demo` | `Demo!Pass123` | 0 |
| College Admin | `college@svbbs.demo` | `Demo!Pass123` | 0 |
| CSR Sponsor | `csr@svbbs.demo` | `Demo!Pass123` | 0 |
| Parent | `parent@svbbs.demo` | `Demo!Pass123` | 0 |

The student and the college admin are both seeded into a demo college ("Nehru Institute of Technology"), so the College Admin dashboard has real data to scope to. The parent account is seeded linked specifically to the demo student (Asha Verma) via `parentId`.

## Prerequisites

- Node.js 22.x
- A free MongoDB Atlas cluster

## Setup

### 1. Server

```bash
cd server
npm install
cp .env.example .env
# Paste your MongoDB Atlas connection string into MONGO_URI
# Generate real random strings for JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_KEY
npm run dev
```

### 2. Seed the database (run once)

```bash
npm run seed
```

### Running the tests

```bash
cd server
npm test             # runs the Vitest unit suite once (120 tests)
npm run test:coverage  # runs with a coverage report
npm run test:watch     # re-runs on change while developing
```

These are unit tests of the pure business logic and need no database or running server.

### Troubleshooting

**`Connection failed: connect ECONNREFUSED ::1:27017` when running the server.** This means `MONGO_URI` isn't actually set, so it's falling back to a local MongoDB on `localhost:27017` that isn't running. Make sure `server/.env` exists (`cp .env.example .env` if not) and that you've pasted a real connection string into `MONGO_URI` — either a free MongoDB Atlas cluster (recommended) or a locally-running MongoDB if you specifically want that.

**Dependency versions resolve differently than expected.** All dependencies in both `package.json` files are pinned to exact versions (no `^` ranges) and a `package-lock.json` is included specifically to prevent this — running `npm install` should reproduce the exact dependency tree this was built and tested against. If you still see a mismatch, delete `node_modules` and reinstall rather than running `npm update` or `npm audit fix --force`, since those intentionally pull in newer major versions.

**Login fails with `"email" must be a valid email" even with a correct demo account.** Joi's `.email()` validator checks the domain against a real-world TLD allowlist by default, and the made-up `.demo` TLD used by every seeded demo account wasn't recognized by default — this is fixed in `validators/authValidators.js` and covered by regression tests.

**Login seems to work but you get logged out / shown the login button again right after.** In production (Vercel + Render), this is solved via `sessionStorage`-based session persistence that survives cross-origin cookie restrictions — see `client/src/services/api.js` and `AuthContext.jsx`. Locally, make sure `VITE_API_URL` in `client/.env` is either blank or points correctly at your local server.

**Some book covers show a blank/gray box instead of a real cover or the placeholder design.** Fixed at the component level: `BookCover.jsx` always renders the styled title/author placeholder as a base layer, with the real image fading in on top only once it's confirmed to be a genuine, non-degenerate image (checked via `naturalWidth`/`naturalHeight`, not just the absence of an error event). This means a slow-loading or genuinely missing cover never shows a blank plate — worst case is an attractive placeholder card.

**AI features show fallback responses instead of live AI answers.** This means either `MOCK_AI=true` is set, or both `GEMINI_API_KEY` and `GROQ_API_KEY` are unset/exhausted. Every AI feature has an honest, clearly-labeled fallback so the app stays fully functional either way — set real keys on Render to get live AI responses.

### 3. Client

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

## Notes on running without paid API keys

- `MOCK_AI=true` (default) — every AI feature works fully without a Gemini key, using clearly-labeled smart fallbacks.
- `GEMINI_API_KEY` / `GROQ_API_KEY` — both free-tier providers; the chatbot and other AI features cascade through Gemini, then Groq, before falling back.
- `MOCK_PAYMENTS=true` (default, implicit) — the cash portion of a hybrid payment completes instantly without a real Razorpay integration; the seam is there for later.
- No `SMTP_HOST` set (default) — verification/reset emails log to the server console.
- No `SENTRY_DSN` set (default) — error tracking is a complete no-op; set a DSN to enable it with zero added dependencies.

## Project structure

See `/docs/ARCHITECTURE.md` for the full slice-by-slice build journal. For the actual spec-requested documentation set:

- [`docs/ARCHITECTURE_OVERVIEW.md`](docs/ARCHITECTURE_OVERVIEW.md) — a concise system description (layers, request flow, key patterns)
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) — every collection, field, relationship, and index
- [`docs/API.md`](docs/API.md) — all REST endpoints, grouped by resource, with auth requirements
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — a practical guide to deploying this stack to Render + Vercel
- [`docs/RESUME_BULLETS.md`](docs/RESUME_BULLETS.md) — specific, metric-grounded bullet points based on what was actually built
- [`docs/INTERVIEW_QA.md`](docs/INTERVIEW_QA.md) — real questions and honest answers grounded in actual decisions made during the build

## Continuous Integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs automatically on every push and pull request. It runs the full test suite with coverage reporting, a production-dependency security audit, a syntax check across every server file, a server boot check, and a client build check, all against the exact dependency versions pinned in the committed lockfiles (`npm ci`, not `npm install`).

To see it run: go to the **Actions** tab on this repo and watch it execute. No GitHub secrets or external services are required — every check runs entirely against pure logic and the build process itself, with no live database dependency.

## What's next

The original spec audit (RFID, Donate/Sell/Exchange flows, all 9 exam categories, College Scholarship + Demand Forecasting, Super Admin Fraud Detection, CSR Sponsored Books, Return Reminders, personal Sustainability Impact, Recycler Revenue Tracking, CSR category breakdowns) is fully closed. On top of that, a full AI v2 pass added eight distinct AI features across the platform with resilient fallbacks, and an engineering-hardening pass brought the test suite to 120 tests with CI coverage gating, a production security audit, and dependency-conscious error tracking. See `ARCHITECTURE.md` for the honest list of anything still deliberately out of scope.