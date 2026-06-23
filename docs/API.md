# SVBBS API Documentation

Base URL (local dev): `http://localhost:5000/api` (proxied through the client at the relative path `/api` — see the Troubleshooting section of the main README for why this matters).

All endpoints return JSON in the shape `{ success: boolean, message: string, ...data }`. Authenticated endpoints expect a Bearer access token in the `Authorization` header; the access token is obtained via `/auth/login` and kept in memory client-side (not localStorage), refreshed via an HttpOnly cookie against `/auth/refresh`.

**76 routes total**, generated directly from the route files, not hand-maintained separately — if this list and the code ever drift, the code is the source of truth.

---

## Auth (`/api/auth`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/register` | — | Create a student account (or any self-registerable role) |
| POST | `/verify-email` | — | Confirm a registration via emailed token |
| POST | `/resend-verification` | — | Resend the verification email |
| POST | `/login` | — | Authenticate, returns access token + sets refresh cookie |
| POST | `/refresh` | cookie | Silently renew the access token using the HttpOnly refresh cookie |
| POST | `/logout` | required | Invalidate the current session |
| POST | `/logout-all` | required | Invalidate every session for this account |
| GET | `/sessions` | required | List active sessions for this account |
| DELETE | `/sessions/:sessionId` | required | Revoke one specific session |
| POST | `/forgot-password` | — | Request a password reset email |
| POST | `/reset-password` | — | Complete a password reset with the emailed token |
| GET | `/me` | required | Current authenticated user's profile |
| POST | `/mfa/setup` | required | Begin TOTP MFA enrollment |
| POST | `/mfa/verify` | required | Confirm MFA enrollment with a code |
| POST | `/mfa/disable` | required | Turn MFA off |

## Books (`/api/books`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | — | List/search/filter the marketplace |
| GET | `/recommendations` | required | Personalized picks from borrow history (simple ranking, not ML) |
| GET | `/mine` | student | A student's own deposited/listed books |
| POST | `/` | student | Deposit a book — Deposit, Donate, Sell, or Exchange |
| GET | `/:id` | — | Book detail + full history ledger |
| GET | `/:id/qrcode` | — | Real QR code PNG linking to this book |
| POST | `/:id/scan` | optional | Logs a QR-scan event |
| GET | `/:id/waitlist` | required | This user's waitlist status for the book |
| POST | `/:id/waitlist` | required | Join the waitlist |
| DELETE | `/:id/waitlist` | required | Leave the waitlist |
| POST | `/:id/buy` | student | Outright cash purchase of a Sell-listed book |
| POST | `/:id/exchange-propose` | student | Propose a swap for an Exchange-listed book |

## Wallet (`/api/wallet`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/me` | required | Current KC balance |
| GET | `/transactions` | required | This user's transaction history |
| GET | `/my-books` | required | Books currently held; also runs the on-demand due-reminder check |
| POST | `/borrow/:bookId` | required | Borrow with hybrid KC + cash payment |
| POST | `/return/:bookId` | required | Return a held book |

## Exchanges (`/api/exchanges`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/mine` | student | Proposals sent and received |
| POST | `/:id/respond` | student | Accept or decline a swap proposal |

## AI Verification (`/api/ai`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/verify-book/:bookId` | required | Mock-by-default AI condition/authenticity check (real Gemini call if `MOCK_AI=false` and a key is set) |

## Chatbot (`/api/chatbot`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/history` | required | This user's persisted conversation history |
| POST | `/message` | required | Send a message, get a reply — mock-by-default, grounded in real live data (KC constants, the user's own due dates, real inventory), same `MOCK_AI` flag and extension seam as AI Verification |

## RFID (`/api/rfid`) — vendor only

| Method | Path | Purpose |
|---|---|---|
| GET | `/tags` | This vendor's registered tags |
| GET | `/stats` | Tagged/checked-in/checked-out counts |
| GET | `/history/:bookId` | Scan history for one tagged book |
| POST | `/register` | Register a tag for an untagged book in inventory |
| POST | `/scan` | Simulate a reader tap — flips checked-in/out |

## Government Exam Hub (`/api/exams`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | All 9 categories with overview + real/coming-soon status |
| GET | `/:code` | One category's detail + its books |

## Vendor (`/api/vendor`) — vendor only

| Method | Path | Purpose |
|---|---|---|
| GET | `/inventory` | Books this vendor owns |
| GET | `/transactions` | Transactions tied to this vendor's books |
| GET | `/stats` | Inventory + cash-earned summary |

## College (`/api/college`) — college_admin only

| Method | Path | Purpose |
|---|---|---|
| GET | `/overview` | Scoped student analytics, sustainability framing, category breakdown |
| GET | `/students` | This college's students with borrow counts |
| GET | `/demand-forecast` | Trending categories + waitlist pressure among this college's students |
| GET | `/scholarships` | Scholarship history + totals |
| POST | `/scholarships` | Award a real KC scholarship to one of this college's own students |

## CSR (`/api/csr`) — csr_sponsor only

| Method | Path | Purpose |
|---|---|---|
| GET | `/summary` | Grant stats, sponsored-book category breakdown, recent activity |
| GET | `/students` | All students, with wallet balance + total sponsored |
| GET | `/sponsorable-books` | Books eligible to be sponsored outright |
| POST | `/grant` | Cash-equivalent KC grant to a student's wallet |
| POST | `/sponsor-book` | Fund one specific book for one specific student — a real, free borrow |

## Recycler (`/api/recycler`) — recycler only

| Method | Path | Purpose |
|---|---|---|
| GET | `/candidates` | Poor-condition books eligible for recycling |
| GET | `/recycled` | Already-processed books |
| GET | `/stats` | Pending/total-recycled counts |
| GET | `/revenue` | Scrap-value revenue tracking, total + per-book |
| POST | `/recycle/:bookId` | Process a book — removes it from circulation |

## Super Admin (`/api/superadmin`) — super_admin only

| Method | Path | Purpose |
|---|---|---|
| GET | `/stats` | Platform-wide user/book/KC economy stats |
| GET | `/audit-logs` | Recent audit trail |
| GET | `/fraud-signals` | Real heuristics: suspicious IPs, accounts under attack, high-velocity users |

## Parent (`/api/parent`) — parent only

| Method | Path | Purpose |
|---|---|---|
| GET | `/children` | This parent's linked child(ren) with wallet balance + activity |

## Passport (`/api/passport`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/me` | required | Academic Passport data |
| GET | `/me/pdf` | required | Real generated PDF export |

## Notifications (`/api/notifications`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | required | List + unread count |
| POST | `/read-all` | required | Mark everything read |
| POST | `/:id/read` | required | Mark one read |

## Sustainability (`/api/sustainability`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/` | — | Platform-wide impact (everyone combined) |
| GET | `/me` | required | One student's own personal impact |

## Health (`/api/health`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Liveness check, no DB dependency |

---

## Conventions worth knowing

- **Frontend guards are convenience only.** Every authorization boundary that actually matters is enforced server-side — e.g. a Sell or Exchange listing genuinely cannot be borrowed via `POST /wallet/borrow/:bookId` even if the UI never exposes that path for it.
- **Atomic guards, not check-then-act.** Anywhere two people could race for the same resource (borrowing, waitlist promotion, RFID scans, exchange acceptance), the actual state transition is a single `findOneAndUpdate` with the precondition baked into the filter, not a separate read followed by a write.
- **Validation runs server-side regardless of what the client already checked**, via Joi schemas in `validate()`/`validateQuery()` middleware — see `server/validators/`.
- **No fake real-time behavior.** Nothing in this API claims to update on a schedule it doesn't actually run (see the Return Reminders design note in the main README for the specific reasoning).
