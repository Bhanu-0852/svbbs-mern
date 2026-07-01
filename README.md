# SVBBS — Smart Vendor Book Bank System

[![CI](https://github.com/Bhanu-0852/svbbs-mern/actions/workflows/ci.yml/badge.svg)](https://github.com/Bhanu-0852/svbbs-mern/actions/workflows/ci.yml)

**Live:** [svbbs-mern.vercel.app](https://svbbs-mern.vercel.app) · **API:** [svbbs-mern.onrender.com](https://svbbs-mern.onrender.com)

A circular economy for educational resources — a MERN-stack platform where students deposit, borrow, donate, sell, and exchange textbooks using **Knowledge Credits (KC)**, an in-app currency. Combines EdTech, a KC-based FinTech layer, GreenTech (sustainability tracking), and a resilient AI layer with graceful fallbacks throughout.

## Tech stack

React (Vite) · Tailwind · Node.js · Express · MongoDB Atlas · JWT auth with refresh rotation + CSRF · Vitest · GitHub Actions CI · deployed on Vercel (frontend) + Render (backend).

## AI features

Every AI feature follows one honest pattern: **real logic or real data does the work, AI adds explanation or generation on top, and a deterministic fallback keeps the feature working when no AI provider is available.** Nothing here fakes machine learning it doesn't do.

- **Provider Abstraction Layer** — a Strategy-pattern interface (`aiProvider.js`) over all AI backends. Callers use one `generate()` / `generateJson()` function; the layer cascades Gemini (flash → flash-lite) → Groq (Llama 3.3), returning the first success. Adding Claude, GPT, Llama, or DeepSeek means writing one adapter and registering it — no feature code changes. This is what makes the AI resilient to quota limits and outages.
- **AI Chatbot with voice** — a general-purpose assistant on every page; Web Speech API for voice in/out; answers platform questions from live user data (KC balance, due dates, inventory) and general questions too.
- **AI Book Verification** — analyzes a book's condition, including photo-based verification via Gemini Vision.
- **Natural-language search** — "cheap physics books under 100 KC" is parsed into real filters, with a keyword-based fallback parser.
- **Smart Exchange Matching** — a transparent weighted-scoring algorithm ranks swap partners by KC fairness, category overlap, and same-college/department; AI writes the explanation. Fully unit-tested.
- **Career Mentor** — generates a personalized roadmap (skills, projects, certifications, interview topics) grounded in the student's real borrow history.
- **Reading Difficulty Analyzer** — estimates difficulty level, reading time, prerequisites, and suitable semester for any book.
- **Study recommendations, book summaries, book advisor, deposit price helper** — AI-assisted guidance across the borrowing journey, each with a fallback.

## Core platform

Seven role dashboards (Student, Vendor, Admin, Recycler, College, CSR, Parent) · KC Wallet with hybrid KC+cash borrow/return · Deposit/Donate/Sell/Exchange flows · 9 Government Exam categories · Academic Passport with scannable QR · Reserve/Waitlist + Notifications · RFID tag tracking · College Scholarships + Demand Forecast · Super Admin fraud detection (rule-based) · CSR sponsored books · Sustainability impact tracking · light/dark themes.

## Engineering

- **141 tests** (Vitest) covering KC rules, loan policy, the exchange-scoring algorithm, the AI provider guard paths, the difficulty/career fallbacks, and a regression guard that keeps the client-side KC estimate identical to the server's real credit logic.
- **CI/CD** (GitHub Actions) — syntax-checks every file, runs the suite with coverage, audits production dependencies for high/critical vulnerabilities, and verifies the server boots and client builds, on every push.
- **Dependency-conscious observability** — error tracking built as a ~60-line zero-dependency HTTP reporter after the full Sentry SDK was found to add 19 vulnerability advisories for unused OpenTelemetry instrumentation.
- **Resilient by design** — the AI cascade, session persistence that survives cross-origin cookie restrictions (Vercel↔Render), and graceful degradation everywhere mean quota limits or missing keys never break a feature.

## Demo accounts

All use password `Demo!Pass123`:

| Role | Email |
|---|---|
| Student | `student@svbbs.demo` |
| Vendor | `vendor@svbbs.demo` |
| Super Admin | `admin@svbbs.demo` |
| Recycler | `recycler@svbbs.demo` |
| College | `college@svbbs.demo` |
| CSR | `csr@svbbs.demo` |
| Parent | `parent@svbbs.demo` |

## Setup

```bash
# Server
cd server
npm install
cp .env.example .env   # set MONGO_URI, JWT secrets, ENCRYPTION_KEY; optionally GEMINI_API_KEY / GROQ_API_KEY
npm run seed           # seed demo data (run once)
npm run dev

# Client
cd client
npm install
cp .env.example .env
npm run dev
```

## Running without paid API keys

- `MOCK_AI=true` (default) — every AI feature works via clearly-labeled fallbacks, no key needed.
- `GEMINI_API_KEY` / `GROQ_API_KEY` — both free-tier; the provider layer cascades through them.
- No `SMTP_HOST` — verification/reset emails log to the server console.
- No `SENTRY_DSN` — error tracking is a no-op.

## Tests & CI

```bash
cd server
npm test              # 141 tests
npm run test:coverage # with coverage report
```

CI runs automatically on every push — see the Actions tab.