# Architecture Overview

A concise description of SVBBS's system structure. For the full slice-by-slice build history and every design decision made along the way, see `ARCHITECTURE.md` in this same folder — that file is a build journal, not a system diagram; this one is.

## High-level shape

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   React Client    │  HTTP   │   Express API     │  driver │  MongoDB Atlas  │
│   (Vite, Tailwind) │ ──────▶ │   (Node.js)        │ ──────▶ │  (Mongoose ODM) │
└─────────────────┘  /api    └──────────────────┘         └─────────────────┘
        │                              │
        │ Context API                  │ JWT + RBAC middleware
        │ (Auth, Theme, Wallet)        │ on every protected route
```

In local development, the client never talks to the API directly across origins — Vite's dev server proxies `/api/*` to the backend on a different port, keeping every request same-origin in the browser (this matters for cookie-based session handling; see the Troubleshooting section of the main README for a real bug this caused when it was misconfigured).

## Backend layering

Every feature follows the same four-layer shape, no exceptions:

```
routes/*.js         → defines paths, attaches auth/role/validation middleware
   ↓
controllers/*.js    → thin HTTP glue: parse req, call a service, shape the response
   ↓
services/*.js       → the actual business logic, database queries, atomic transactions
   ↓
models/*.js         → Mongoose schemas
```

`utils/` holds pure, side-effect-free logic extracted out of services specifically to be directly unit-testable — pricing rules, due-date classification, fraud-signal thresholds, waitlist FIFO ordering. The pattern throughout: if a piece of logic is "given this input, what's the right output," it lives in `utils/` with a Vitest file next to it. If it requires talking to the database, it lives in `services/`.

`middleware/` holds the cross-cutting concerns applied to routes: `requireAuth` (validates the JWT), `requireRole` (RBAC), `validate`/`validateQuery` (Joi schema enforcement), rate limiters, CSRF checks.

## Frontend layering

```
pages/<role>/Dashboard.jsx   → one real page per role, fetches its own data
components/                  → reusable UI (Card, Button, Modal, BookCard, ...)
context/                     → AuthContext, ThemeContext — global state via Context API
services/api.js              → the one axios instance every page imports
routes.jsx                   → React Router config, lazy-loaded per page
```

Every page is lazy-loaded (`React.lazy`) behind a single `Suspense` boundary — this dropped the main JS bundle from 732KB to 242KB by isolating heavy, rarely-used dependencies (Recharts, used only by two pages) into their own on-demand chunk instead of shipping it to every visitor.

## The two boundaries that actually matter

**Authorization is enforced server-side, full stop.** `ProtectedRoute` in the React Router config exists for UX only — redirecting someone who clearly shouldn't be on a page to somewhere sensible. It is not the real security boundary. Every protected API route independently checks `requireAuth` + `requireRole`, and several services go further: the borrow endpoint, for example, explicitly excludes Sell/Exchange-listed books from its atomic query filter, not just from what the UI shows.

**State transitions that could race are atomic, not check-then-act.** Borrowing a book, promoting the next person off a waitlist, scanning an RFID tag, accepting a swap proposal — every one of these uses a single `findOneAndUpdate` (or a `mongoose` session transaction when more than one document needs to change together) with the precondition baked into the query filter itself, so two simultaneous requests can't both "win" and corrupt state.

## Data flow example: borrowing a book

1. Client calls `POST /api/wallet/borrow/:bookId` with a Bearer token
2. `requireAuth` middleware validates the JWT, attaches the real user document to `req.user`
3. `walletController.borrow` calls `borrowService.borrowBook(userId, bookId, req)`
4. Inside a Mongoose session transaction: an atomic `findOneAndUpdate` on the book (only succeeds if still available), the user's `KCWallet` balance is debited by `min(balance, kcCost)`, a `Transaction` record and a `BookHistory` entry are created, all inside the same session — if any step fails, the whole transaction rolls back
5. `logAudit()` records the action outside the transaction (audit logging failing shouldn't roll back a successful borrow)
6. Response shape: `{ success, message, book, transaction }`

Every other money-moving or state-changing flow in the app (selling, returning, recycling, sponsoring, scholarships) follows this same shape: atomic guard → real database writes via a session where multiple documents change together → audit log → typed response.

## Why MongoDB over a relational database

The data is naturally document-shaped (a Book with embedded-feeling condition photos and category tags, a User with role-specific fields that vary by role) and the access patterns are mostly "fetch one entity and its closely related data," not complex multi-table joins — a good fit for MongoDB's strengths. Where genuine cross-document consistency is required (a borrow touching a Book, a Wallet, a Transaction, and a BookHistory entry all at once), Mongoose sessions provide real ACID transactions, not an eventual-consistency shrug.
