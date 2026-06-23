# SVBBS — Smart Vendor Book Bank System
### Complete Build Blueprint & Architecture Plan

> A circular economy for educational resources. EdTech + FinTech (Knowledge Credits) + GreenTech (Sustainability), built on the MERN stack with AI verification.

---

## 1. Product Thesis (Read This First)

Most "book exchange" apps die because of three failures: **trust** (is the book real and in good condition?), **liquidity** (the book I want isn't there when I want it), and **incentive** (why give before I take?).

SVBBS solves all three:

- **Trust** → AI condition verification + a public *Book History Ledger* that travels with every book.
- **Liquidity** → Request board, waitlists, reservations, and demand forecasting that tells vendors what to stock.
- **Incentive** → The **Knowledge Credit (KC)** economy. You earn by giving (deposit/donate/recycle) and spend by taking (borrow/buy/exchange), with cash filling any gap.

The single feature that makes this *yours* and resume-defining: the **Academic Passport** — a portable, verified record of every book a student has read, donated, and studied, exportable as a PDF / shareable badge. It turns a book app into a *lifelong learning identity platform*.

---

## 2. Design Direction — "Premium Library"

The brief says: reduce emoji clutter, premium feel, real book photos, make users *feel something*. So the visual identity is **a modern digital library** — warm paper tones meeting deep midnight-navy, with gold reserved exclusively for Knowledge Credits so KC always feels like real currency.

### 2.1 Visual Concept
Books are the hero, not icons. Every book renders as a real **cover photo with a spine, shadow, and a slight 3D lift on hover** — like pulling a volume off a shelf. Dashboards feel like a private study desk, not a SaaS admin panel.

### 2.2 Color Tokens

| Token | Hex | Used for |
|---|---|---|
| Navy 950 | `#05080F` | Dark-mode deepest background |
| Navy 900 | `#0A0F1E` | Dark-mode page background |
| Navy 700 | `#1C2940` | Dark-mode cards |
| Paper | `#FBF8F1` | Light-mode background (warm, not stark white) |
| Ink | `#0F172A` | Primary text |
| **KC Gold** | `#F0A500` | **Knowledge Credits ONLY** — never decorative |
| Forest 500 | `#059669` | Sustainability / positive impact |
| Slate 400–600 | `#94A3B8`–`#475569` | Secondary text, borders |

**Rule:** Gold means money. If it isn't about KC, it isn't gold. This single discipline makes the currency feel valuable everywhere it appears.

### 2.3 Typography
- **Display:** `Playfair Display` (serif) — headings, KC balances, hero. Gives the "library / scholarship" gravity.
- **Body & UI:** `Inter` — everything functional.
- **Numbers & data:** `JetBrains Mono` — KC amounts, RFID tags, ISBNs, receipts. Monospaced numbers read as "real ledger."

### 2.4 Reducing Emoji — The Replacement Strategy
Instead of emojis we use a **single consistent icon set** (`react-icons` / Lucide outline style), small typographic **eyebrow labels** (e.g. `KNOWLEDGE CREDIT`), and **state through color + motion**, not symbols. Where the old plan would drop a 🔴/🟡/🟢, we use a small colored dot + a word ("Available", "On loan", "Reserved").

### 2.5 Motion (deliberate, never noisy)
- Books **rise 8px** on hover with a deepening shadow.
- KC balance **counts up** when it changes (animated counter).
- Page sections **fade-and-slide in** on scroll once, not constantly.
- Respect `prefers-reduced-motion` — all of the above collapse to instant.

### 2.6 Theme System
Light / Dark / System (default). System reads `prefers-color-scheme`, choice persists in `localStorage`, applied via a `class` on `<html>`, with a smooth 200ms color transition. Theme toggle lives in the navbar as a three-state segmented control (Sun / Monitor / Moon), not a single switch.

### 2.7 Premium Polish — the details that signal quality
These are the small things that make a portfolio project look like a real product:

- **Glassmorphism** on the navbar and modals — frosted blur over content, subtle border.
- **Soft depth** — layered shadows, never flat boxes; cards lift on hover.
- **Skeleton loaders** instead of spinners — content shapes shimmer while loading, so nothing ever feels broken.
- **Micro-interactions** — buttons press, toggles spring, the KC balance counts up, success states pulse gold once.
- **Empty states with personality** — never a blank screen; an illustration-light prompt that invites the next action.
- **Toast notifications** that slide in from the corner, auto-dismiss, and stack cleanly.
- **Consistent 8px spacing grid** — everything aligns; nothing feels accidental.
- **Page transitions** — gentle fade/slide between routes via Framer Motion.
- **Real cover photos everywhere** — via Open Library Covers API, so no placeholder gray boxes.
- **Receipts, certificates, and the Academic Passport render as designed documents**, not plain text — they look printable and shareable.

The discipline: spend boldness in *one* place per screen (the hero, the KC balance, the book shelf) and keep everything around it quiet. That restraint is what reads as "premium" rather than "busy."

---

## 3. The Borrow Experience (the part you asked to "feel good")

This is the emotional core, so it gets special treatment:

1. **Browse** — a shelf of real cover photos. Hover lifts the book and reveals KC cost + availability.
2. **Book detail** — large cover on the left, a flippable look at condition photos, the **Book History Ledger** (this copy has had 3 owners, last verified "Good"), and the borrow panel on the right.
3. **Borrow panel** — shows your KC balance vs. cost. If KC is short, a clean **hybrid payment** breakdown animates in: `Cost 300 KC → You have 200 KC → Pay ₹100 in cash`.
4. **Confirm** — a receipt slides up, the book "moves" into *My Books* with a subtle shelf animation, and a return-reminder is scheduled.

Every book object carries a `coverImage` and an array of `conditionPhotos` so the UI always has something real to show. Seed data uses real public cover URLs (Open Library Covers API) so it never looks empty or fake.

### 3.1 Book Image Plan (browse, buy & borrow all use real photos)
Books are the hero of the product, so the image treatment is detailed and consistent everywhere a book appears:

- **Cover source** — Open Library Covers API by ISBN (`covers.openlibrary.org/b/isbn/{isbn}-L.jpg`) in seed data, with a graceful generated-cover fallback (title + author on a colored spine) when no cover exists, so there are *never* broken images.
- **The `BookCover` component** — one reusable component renders the cover with a real **spine edge, page-thickness on the side, and a soft drop shadow**, so a flat image reads as a physical book. Used in the shelf, cards, detail page, cart, receipt, and Passport.
- **Browse shelf (Marketplace)** — a responsive grid of covers on a subtle wood/paper-toned shelf. On hover the book **lifts 8px**, shadow deepens, and a quiet overlay shows KC cost + an availability dot. Lazy-loaded + skeleton shimmer while images fetch.
- **Buy / borrow flow** — large hero cover on the left; a small carousel of **real condition photos** (front, back, spine, any wear) so buyers see the *actual* copy, not a stock image. This is what makes purchases feel trustworthy and premium.
- **Book detail** — cover + condition carousel + the AI condition heatmap overlay + the Book History Ledger, all anchored to the real photos.
- **Quality rules** — fixed aspect ratio (2:3) to prevent layout shift, `loading="lazy"`, blur-up placeholder, and consistent corner radius + shadow tokens so every cover across the app looks like it belongs to one designed system.

Result: browsing feels like walking a real library shelf, and buying feels like inspecting the actual book in your hands.

### 3.2 Cancellation & Refund Rule (decided)
- **Reservation cancelled before pickup/handoff confirmation** → instant, full KC refund, no penalty.
- **Borrow cancelled after the vendor/owner confirms physical handoff** → no refund (the book has physically moved; treated as completed). This boundary — "has the book physically changed hands yet" — is the single rule the whole wallet logic hangs on, so it never needs a special case per scenario (borrow, exchange, sale all use it).
- Cancellations are logged to `AuditLog` and visible in the student's Transaction history with a clear "Cancelled — refunded" or "Completed" state.

---

## 4. Complete Feature List (everything, including all 20 additions)

### Phase 1 — Foundation
- **Auth (production-grade, see §9):** register, login, logout, email verification, forgot/reset; JWT access (in-memory) + rotating refresh (HttpOnly cookie) backed by a server-side Session store; reuse detection; bcrypt; RBAC + ownership checks for all 6 roles
- **MFA:** TOTP authenticator apps + hashed backup codes + step-up auth for sensitive actions
- **Login defense:** rate limiting, account lockout, progressive delay, CAPTCHA, IP throttling, timing-safe responses, no email enumeration
- **Security headers & transport:** Helmet (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy), strict CORS, CSRF, HTTPS + HSTS, mongo-sanitize, Joi validation, audit logging
- **Account awareness:** new-device login alerts, view active sessions, remote logout
- Theme system (Light / Dark / System)
- Book management: deposit, borrow, exchange, donate, sell, recycle, reserve, waitlist
- **Book photos + condition photos** on every book
- KC Wallet + Hybrid Payment (mock gateway, Razorpay-ready)
- **Book History Ledger** *(new)*

### Phase 2 — Intelligence
- AI Book Verification (Gemini): title, ISBN, authenticity, condition → AI Score + KC recommendation + condition report
- RFID: registration, tracking, check-in/out, scan history
- Government Exam Hub: UPSC, SSC, Banking, Railways, Defence, APPSC, TSPSC, GATE, CAT — each with overview, recommended + available books, search/filter, borrow/reserve/waitlist (seeded with real books)
- **AI Personalized Recommendations** *(new)*
- **AI Price & KC Estimator** *(new)*
- **AI Cover Scanner / OCR autofill** *(new)*
- **AI Condition Grader with wear heatmap** *(new)*
- **Semantic Search** *(new)*
- **AI Summary on every book** *(new)*
- **Book Request / Pre-Order board** *(new)*
- **QR codes alongside RFID** *(new)*
- **AI Chatbot "KnowledgeBot" + Voice mode** *(new)*

### Phase 3 — Engagement & Roles
- All 6 dashboards (Student, Vendor, College Admin, Super Admin, Recycler, CSR)
- Sustainability module: books reused/recycled, trees saved, CO₂ reduced, money saved + charts
- Notifications: in-app, reservation, waitlist, borrow & return reminders
- **Late return penalty system** *(new)*
- **Leaderboard & gamification + badges** *(new)*
- **Vendor rating & review** *(new)*
- **Study Group marketplace** *(new)*
- **Book bundles** *(new)*
- **College verification badge** *(new)*
- **Damage reporting / KC escrow dispute flow** *(new)*

### Phase 4 — Differentiators & Polish
- **Academic Passport** (exportable reading identity) *(new — signature feature)*
- **AI Study Planner + Exam Predictor** *(new)*
- **AI Demand Forecaster** (College Admin) *(new)*
- **AI Sustainability Coach** *(new)*
- **AI Negotiation Assistant** (auctions/exchanges) *(new)*
- **AI Duplicate / Fraud Detector** (Super Admin) *(new)*
- **Digital Book Companion** (AI summary for donated books) *(new)*
- **Carbon Credit Certificate** (PDF, LinkedIn-ready) *(new)*
- **Parent / Guardian portal** *(new)*
- **Book Auction (bid in KC)** *(new)*
- **Alumni donation drive** *(new)*
- **Multilingual i18n** (English, Hindi, Telugu, Tamil) *(new)*
- **Offline PWA mode** *(new)*
- Platform analytics, fraud detection, KC economy monitoring, production optimizations

---

## 5. Build Order

### 5.0 Important — read this before trusting any "Slice N" reference in this document

The list in §5.1 below is the **original full-scope plan**, written before development started. After Slice 2 was delivered, the project was **reprioritized for a 2-day interview/portfolio deadline**: a small set of features built to work flawlessly, rather than broad shallow coverage of all 17 original slices. From that point on, the slice numbers actually shipped (the `svbbs-slice-N.zip` files) **diverge from the numbers below** — they follow their own sequential order based on what was actually prioritized and built, not this original list.

**If you're holding a `svbbs-slice-N.zip`, trust its own README's "This is Slice N" description and the "What works right now" section over the numbering in §5.1 below.** Section §5.2 maps the two numbering schemes against each other so the divergence is explicit rather than silently confusing.

### 5.1 Original full-scope plan (superseded numbering — kept for reference only)

I build **vertical slices**, not horizontal layers — each slice is a working feature end-to-end (DB → API → UI) so you always have something runnable to demo. This was the plan before the 2-day reprioritization:

```
Slice 0  Project scaffold + design system + theme + layout shell + error boundary/404
Slice 1  Auth (6 roles, JWT+rotation+Session store, MFA, lockout, reset) + protected routes + audit log
Slice 2  Book model + seed (real covers) + Marketplace shelf + Book detail
Slice 3  KC Wallet + Hybrid Payment + receipt
Slice 4  Borrow / Reserve / Waitlist + Book History Ledger + reminders
Slice 5  AI Verification (Gemini) + condition report
Slice 6  RFID + QR check-in/out + scan history
Slice 7  Government Exam Hub (seeded per exam)
Slice 8  Student Dashboard + Recommendations + Academic Passport
Slice 9  Vendor + Recycler dashboards
Slice 10 College Admin + Super Admin (analytics, fraud, KC monitoring)
Slice 11 CSR + Parent portals + Alumni drive
Slice 12 Sustainability module + Carbon Certificate + charts
Slice 13 Notifications + Leaderboard + Badges + Reviews
Slice 14 Study Groups + Bundles + Auction + Request board
Slice 15 KnowledgeBot + Digital Book Companion
Slice 16 i18n + PWA + production hardening + docs
```

Each slice ships with: model + validation + controller + service + route + frontend page/component + seed data where relevant.

### 5.2 What was actually delivered (matches the zip you're holding)

After the Day-1/Day-2 reprioritization, delivery order and scope changed. This is the real, current build log — update this list every time a new slice ships, rather than re-copying §5.1's numbering on top of it.

```
Slice 0  Project scaffold + design system + theme + layout shell        [same as original plan]
Slice 1  Full production auth (register/login/MFA/sessions/RBAC/audit)  [same as original plan]
Slice 2  Book model + real covers + Marketplace + Book detail +
         mock AI Verification panel (originally planned as its own
         later slice; built early since it shares the detail page)
Slice 3  KC Wallet + hybrid payment + real Borrow/Return (Reserve and
         Waitlist intentionally deferred — not yet built)
Slice 4  Government Exam Hub (UPSC/SSC/Banking/GATE have real seeded
         inventory; the other 5 categories show as "Coming soon")
Slice 5  Academic Passport (stats + reading history + real PDF export)
Slice 6  Vendor Dashboard (inventory, who-borrowed-what, real revenue)
Slice 7  Sustainability Impact page (real stats + category chart)
Slice 8  Super Admin Dashboard (platform stats + real audit log feed)
Slice 9  Real QR codes per book (fulfills the original "RFID/QR" pitch
         item without physical hardware) + scan events logged into the
         existing Book History Ledger
Slice 10 Recommendations on the Student Dashboard — a transparent,
         rule-based category-overlap ranking (explicitly not framed as
         "AI" since it isn't a trained model), with a cold-start fallback
         for new users with no borrow history
Slice 11 Recycler Dashboard — the GreenTech role: a recycling queue of
         poor-condition books with a real recycle action (atomic guard),
         a processed-books list, and stats that feed the existing
         Sustainability module
Slice 12 College Admin Dashboard — created the missing College model
         (User.collegeId referenced it from the scaffold but it never
         existed), seeded a demo college, and scoped a real institutional
         dashboard to the admin's own college via its students and their
         borrowing activity (books belong to vendors, so no fake
         institutional book ownership is claimed)
Slice 13 CSR Sponsor portal — a new Sponsorship model + a grant flow
         where a sponsor funds KC into a student's real wallet (atomic
         top-up via the existing wallet system), making granted credits
         genuinely spendable on real borrows; sponsor summary stats and
         grant history
Slice 14 Parent Dashboard — the seventh and final original role. No new
         model needed: reused User.parentId, which already existed but
         was never seeded or used. Deliberately narrower than the CSR
         sponsor: a parent can only top up their OWN linked child's
         wallet (enforced via the existing requireOwnership middleware,
         the same pattern built for book ownership), plus an Impact View
         showing that child's real borrow history
Slice 15 Production hardening, not a feature: route-based code-splitting.
         Every page is now lazy-loaded (React.lazy + a single Suspense
         boundary) instead of one ~730KB upfront bundle. Recharts, which
         only two pages use, now lives in its own on-demand chunk rather
         than shipping to every visitor. Main bundle dropped from 732KB
         to 242KB; the Vite "chunk too large" warning that had quietly
         appeared in every build since Slice 10 is gone
Slice 16 Reserve/Waitlist + real Notifications. Made the previously-
         decorative 'reserved' Book status real: a FIFO waitlist per
         book, and when a held book is returned, whoever's been waiting
         longest gets it reserved exclusively for them (atomic guard, no
         third party can claim it) plus a real Notification record. No
         fabricated time-based expiry on the reservation — deliberately
         simpler and fully synchronous (claim it or release it) rather
         than a fragile background-scheduler model. The Notification
         model is generic but only one real trigger (waitlist_ready) is
         wired up — documented honestly rather than implied to cover
         everything. Also: a full slice-0-to-16 audit caught that every
         dashboard sidebar listed 3 sub-route links (e.g.
         /recycler/processed) that all rendered the same single-page
         dashboard — some even pointed at never-built features (Study
         Groups, RFID). Trimmed every sidebar to only genuinely-separate
         destinations (Overview everywhere, plus the student's Academic
         Passport), so no link is misleading. Dropped the now-unused icon
         imports too, including one pre-existing dead import (FiBarChart2
         in the College dashboard).
Slice 17 Automated test suite (Vitest) — the second hardening slice.
         Throughout the build I'd been writing real unit tests every
         slice and throwing them away; this makes them permanent. 48
         tests across 6 files cover the pure business logic: KC pricing
         rules, password policy, pagination clamping, recommendation
         ranking, waitlist FIFO + the "no third party can steal a
         reservation" rule, and the CSR/parent grant validators. Chose
         Vitest over Jest because the server is ESM-native. Extracted two
         pieces of previously-inline logic (recommendation ranking,
         waitlist queue rule) into their own modules so the tests
         exercise the exact code that ships, not a re-implementation.
         Vitest is a devDependency, so it never ships to production.
         Honest scope: these are unit tests of pure logic — DB
         integration tests would need a live/in-memory Mongo and aren't
         claimed here. (Final-pass polish, prompted by a full re-audit:
         replaced the placeholder About page — which was reachable from
         the site-wide footer but rendered a "not built yet" stub — with
         a real page describing the EdTech/GreenTech/FinTech pillars and
         the seven roles. Removed the now-dead _DashboardStub and
         _PublicStub components, so there are zero stub remnants left in
         the client.) (Second addendum, prompted by a real user-reported
         failure: `npm install` on a fresh machine resolved Vite 8.0.16
         instead of the tested 5.4.21, because every package.json used
         caret ranges with no lockfile shipped. Root cause confirmed via
         `npm audit`: a pre-existing moderate/high-severity esbuild
         advisory in vite/vitest's dependency chain — present since
         vitest was added, dev-only, never audited at the time — whose
         suggested fix is literally "install vite@8.0.16, a breaking
         change." Fixed by pinning every dependency in both package.json
         files to its exact tested version and shipping package-lock.json
         in the delivered zip for the first time, so npm install
         reproduces the tested tree exactly. Also fixed config/db.js,
         which silently fell back to a local MongoDB on connection
         failure and printed only a raw ECONNREFUSED — it now explains
         directly that MONGO_URI likely isn't set and how to fix it.)
         (Third addendum, the most serious one — found only once the user
         had a genuinely live database and tried to actually log in:
         every single demo account login failed with `"email" must be a
         valid email`. Root cause: Joi's `.email()` validates the
         domain's TLD against a real-world allowlist by default, and the
         made-up `.demo` TLD used by all seven seeded accounts isn't on
         it — so literally no demo account could ever log in through the
         API as shipped. This was never caught in the sandbox because no
         live MongoDB was ever available there to exercise a real
         end-to-end login request. Fixed by adding
         `{ tlds: { allow: false } }` to all three email validators in
         authValidators.js (register, login, forgot-password) — the
         standard Joi pattern for accepting non-standard/internal
         domains. Verified directly: all 7 demo emails now validate,
         genuinely malformed input is still rejected, and real-world
         domains like gmail.com still work. Added 4 new permanent
         regression tests pinning this down (48 -> 52 tests) so it can't
         silently break again.) (Fourth addendum: login appeared to
         succeed but the session didn't persist past the first request.
         Root cause was the README's own setup instructions — `cp
         .env.example .env` in the client folder set VITE_API_URL to an
         absolute `http://localhost:5000/api`, which bypasses Vite's dev
         proxy entirely and makes every API call genuinely cross-origin
         (localhost:3000 -> localhost:5000) instead of same-origin
         through the proxy. That's never the path that was actually
         tested — every live check throughout this build used the
         relative /api path through the proxy. Fixed by blanking
         VITE_API_URL in client/.env.example with a comment explaining
         why, so the safe relative-path default applies after a normal
         `cp .env.example .env`. Verified directly: built the client with
         the corrected .env and confirmed no hardcoded localhost:5000
         appears anywhere in the output bundle.)
Slice 18 RFID Integration — explicitly spec'd, previously fully absent
         (the original Slice 11 build even had a dead "RFID Status"
         sidebar link pointing at nothing, later removed in the Slice 16
         polish pass). Real data model now: RfidTag (one tag per book,
         unique tagId, checked_in/checked_out custody status) plus three
         new BookHistory events (rfid_registered, rfid_checked_out,
         rfid_checked_in) feeding the same History Ledger UI every other
         book event already uses. Vendor-only: register a tag for an
         untagged book (mints a realistic EPC-style hex UID, the way a
         fresh physical tag arrives pre-printed), then "scan" a tag ID to
         flip its custody status — atomic guard via findOneAndUpdate so
         two simultaneous scans of the same tag can't double-flip it.
         Honesty note, same pattern as MOCK_AI/MOCK_PAYMENTS: a browser
         cannot talk to physical RFID hardware, so the "scan" action is a
         manual tag-ID entry standing in for a reader tap — but the data
         model, the custody workflow, the audit logging, and the history
         trail are all genuinely real, not faked. New page at
         /vendor/rfid (a real second page, same precedent as the
         student's Academic Passport — the sidebar link is back since
         it's no longer a dead stub). 5 new routes (55 -> 60), pure
         toggle logic extracted to utils/rfidStatus.js and unit tested (4
         new tests, 52 -> 56). Also fixed a real consistency bug found
         while building this: seedBooks.js wiped Book and BookHistory on
         every reseed but never RfidTag, which would have left dangling
         tags pointing at deleted books after a second `npm run seed` —
         added RfidTag to the wipe.
Slice 19 Real Donate/Exchange/Sell flows — the literal first bullet list
         in the original spec ("Deposit/Exchange/Borrow/Donate/Sell/
         Recycle"), and until this slice there was genuinely no way for
         ANYONE — student or vendor — to add a book to the system at all
         outside the seed script. Confirmed by grep before writing a
         line of code: zero POST /books route existed anywhere.
         Built a real student-facing deposit flow with four distinct,
         actually-different behaviors (not just a label, unlike the old
         dormant depositMethod field):
           - deposit: KC value computed via the same kcRules used
             everywhere else, credited to the depositor's wallet
             immediately — the actual "earn Knowledge Credits" loop the
             spec describes, which had no entry point until now
           - donate: kcValue forced to 0 server-side. No special-cased
             borrow logic needed at all — the existing borrowBook flow
             already treats a 0-KC book as a free borrow, since
             kcUsed/cashDue both naturally compute to 0
           - sell: cash-only outright purchase at a listed salePrice via
             a new atomic buyBook (Transaction.type extended from
             ['borrow'] to ['borrow','sell'] — exactly what a prior
             comment had already anticipated: "'sell'/'exchange' are
             natural extensions for later slices"). Ownership transfers
             permanently, status becomes the new terminal 'sold' state
           - exchange: a real two-sided ExchangeProposal model — propose
             a swap by offering one of your own available books, the
             target owner accepts or declines. Accepting is atomic,
             re-validates both books are still genuinely available right
             before swapping (handles a stale proposal where one side
             already moved), and auto-cancels any other pending proposal
             touching either book
         New page /student/deposit (lists the book, shows "My Listings"
         and "Exchange Proposals" with accept/decline). BookDetail now
         shows a real Buy panel or swap-proposal panel instead of the
         Borrow panel when a book is listed for sale or exchange — and
         critically, this is enforced server-side in borrowBook itself
         (excludes depositMethod sell/exchange from the atomic borrow
         guard), not just hidden in the UI, matching this app's own
         stated principle that the frontend guard is convenience only.
         6 new routes (60 -> 66), 11 new validator tests covering the
         conditional salePrice-required-only-on-sell rule (56 -> 67).
         Reused the Slice 18 cover-URL fix by extracting it into a shared
         utils/bookCovers.js so newly-deposited books get working covers
         automatically, with zero duplicated logic.
         Found and fixed two more issues while building this: (1) the
         same dangling-reference bug class as Slice 18's RfidTag fix —
         ExchangeProposal (new) and Transaction (pre-existing, never
         actually wiped before this slice) both reference Book and
         needed adding to the seed script's reseed-wipe; (2) a real
         authorization gap, not just a UI one — discovered while testing
         that the API itself, not just the frontend, needs to refuse
         borrowing a book listed for sale or exchange.
Slice 20 The remaining 5 of 9 spec'd Government Exam categories — Railways,
         Defence, APPSC, TSPSC, CAT. This turned out to be purely a data
         gap, not an infrastructure one: examCategories.js already had
         real metadata for all 9 categories with an honest hasInventory
         flag explicitly separating "real" from "Coming soon" rather than
         showing an empty, misleading shelf — only 4 had hasInventory:
         true. Zero frontend or backend logic changes were needed at all;
         the Exam Hub and category-detail pages already read
         hasInventory directly and render real cards for every category
         once it's true.
         Researched and added 3 new books with genuinely real, verified
         ISBNs (checked against AbeBooks/Amazon listings, not invented):
         R. S. Aggarwal's Quantitative Aptitude for Competitive
         Examinations (Railways, cross-tagged SSC/Banking since it's
         genuinely used across all three in the real world), Arihant's
         Pathfinder NDA & NA Entrance Examination (Defence), and Arun
         Sharma's How to Prepare for Quantitative Aptitude for CAT (CAT).
         For APPSC/TSPSC, rather than risk low-quality or unverifiable
         ISBNs for hyper-regional state-PSC publishers, extended the
         exam tags on the two already-real UPSC books (Indian Polity,
         India's Struggle for Independence) — Polity and Modern History
         are genuinely core, shared subjects across every Indian state
         PSC exam, the same honest cross-tagging pattern already used
         for Wren and Martin across SSC/Banking, not a stretch.
         Verified all 9 categories have real coverage by simulating the
         exact aggregation logic used by the live exam-count endpoint
         against the actual seed data, before ever touching a database.
         23 seed books total (was 20).
Slice 21 College Scholarship Management + Demand Forecasting — two of the
         four spec-listed College Admin sub-features that were missing
         (Student Analytics and Sustainability Reports already existed
         under getOverview).
         Scholarship: new Scholarship model, deliberately NOT reusing the
         existing CSR Sponsorship model even though the mechanics are
         identical (atomic KCWallet credit + an audit-trail record) —
         kept separate because the eligibility rules are genuinely
         different (a college admin can only fund their OWN college's
         students, found via req.user.collegeId; a CSR sponsor can fund
         any student) and mixing them would muddy each role's "how much
         have I given" stats. Reused the exact atomic-transaction pattern
         from csrService.grantToStudent, same 5000-KC sanity cap. UI
         mirrors CSR's GrantModal almost exactly (the same pattern was
         clearly proven out there).
         Demand Forecasting: real signal from the college's own student
         activity, explicitly NOT a trained model — same honesty framing
         already used for recommendationService.js. Two views: trending
         categories by borrow volume, and a genuine "you need more
         copies of X" signal — books this college's students are
         currently waitlisted on, aggregated and ranked by how many are
         waiting. Both computed live from real Transaction/WaitlistEntry
         data, nothing precomputed or faked.
         3 new routes (66 -> 69), 4 new validator tests (67 -> 71).
         Found two real things while building this: (1) collegeService's
         existing getStudents() silently dropped the student's _id from
         its response shape — harmless when the page was read-only, but
         a real bug now that a feature needs to target a specific
         student by ID; added it back. (2) Sponsorship (CSR) was never
         wiped on reseed, a pre-existing gap, same class of issue as
         Slice 18/19's dangling-reference fixes but different in kind —
         User/College _ids stay stable across reseeds (upserted, not
         recreated) so it's not a dangling reference, but KCWallet
         balances DO unconditionally reset on every reseed, so leaving
         old Sponsorship/Scholarship records around would let the "Total
         KC Granted" stats lie about funding history that no longer
         matches the reset wallet. Both now wiped in seedUsers.js
         alongside the wallet reset itself.
Slice 22 Super Admin Fraud Detection — the last of the spec's Super Admin
         sub-features (User Management, Platform Analytics, and KC
         Economy Monitoring already existed under getStats/getAuditLogs).
         Real heuristics over data this app was already honestly
         collecting (LoginAttempt, Transaction) — explicitly not a
         trained model or invented score, the same honesty framing
         already used for recommendationService.js. Three signals:
           - suspiciousIps: one IP failing logins against 3+ distinct
             emails in 24h — a credential-stuffing pattern, not someone
             forgetting their own password
           - accountsUnderAttack: 3+ failed attempts on one account in
             24h — deliberately a LOWER threshold than the real 5-attempt
             lockout in authService.js, so this is a genuine early
             warning surfaced before lockout would even trigger, not just
             a re-display of what's already locked
           - highVelocityUsers: 5+ transactions by one user in 24h —
             unusual activity worth a human glance, explicitly NOT framed
             as an accusation (could be a compromised account, could
             genuinely be a power user)
         Mongo does the real aggregation/grouping work; the actual "what
         counts as suspicious" threshold logic was deliberately extracted
         into utils/fraudSignals.js as plain functions rather than buried
         in pipeline match stages, so the thresholds have a direct,
         readable unit test instead of only being exercised indirectly.
         9 new tests (80 total, was 71), 1 new route (70, was 69). Nothing
         here auto-blocks anyone — it's a dashboard signal for a human
         reviewer, consistent with this app never claiming automated
         enforcement it can't honestly back up.
Slice 23 CSR Sponsored Books — the last spec-listed gap of the audit
         prompted directly by the user, alongside notification reminder
         types (still open). Genuinely distinct from a cash grant, not
         just a relabeling: the sponsor picks a specific book for a
         specific student, and the platform performs a real borrow on
         the student's behalf through the exact same eligibility guard
         borrowBook uses (excludes sell/exchange listings, atomic
         findOneAndUpdate so a book can't be double-sponsored), but
         kcUsed and cashDue are both 0 — the student's own wallet is
         never touched at all, the sponsor covers the full value.
         Two small, deliberate model extensions rather than a parallel
         system: Sponsorship gets an optional bookId (null = the
         existing cash-grant behavior, unchanged; set = a sponsored
         book), and Transaction gets a sponsoredBy field — kept separate
         from kcUsed/cashDue rather than overloading them, so "who
         actually paid" stays an honest, directly-queryable fact instead
         of something inferred. This also means platform-wide "KC spent
         by students" reporting in superAdminService stays accurate for
         free — sponsor-covered amounts correctly don't count as
         spending, since kcUsed is genuinely 0.
         New CSR dashboard CTA "Sponsor a book" alongside the existing
         "New grant", a 4th stat card (Books Sponsored), and the recent-
         activity feed now distinguishes a sponsored book from a cash
         grant in its own line. 2 new routes (72, was 70), 6 new
         validator tests (84 total, was 80).
         Found and fixed a real display bug while building this: the
         student dashboard's transaction list would have shown a
         sponsored borrow as "− 0 KC" with zero context — accurate but
         confusing, reading like a bug rather than a gift. Now shows
         "Sponsored — no cost" instead, using the same sponsoredBy field
         the backend already returns (no new endpoint needed, the field
         just wasn't being read on the frontend yet).
Slice 24 Return reminders — the last item from the full spec audit,
         deliberately deferred until now rather than rushed, because it
         needed real design thought, not just a label. Two genuine
         prerequisites neither of which existed before this slice:
           1. A due-date concept at all. Borrowing was previously fully
              open-ended — no deadline anywhere. Added Book.dueDate, set
              to now + LOAN_PERIOD_DAYS (14) on every real borrow
              (student-initiated AND CSR-sponsored — both go through the
              same dueDate logic, since a sponsored loan is still a real
              loan), cleared back to null on return.
           2. An honest trigger mechanism with no background scheduler —
              this app has deliberately avoided that pattern everywhere
              (see the waitlist's no-auto-expiry design for the same
              reasoning). Built notificationService.checkDueReminders:
              computed live, on demand, wired into the one endpoint a
              student's dashboard always calls anyway
              (GET /wallet/my-books) — the same "checked at relevant
              action points, not on a timer" pattern as everything else.
              A 20-hour cooldown per book per notification type prevents
              re-spamming the same reminder on every single page load.
         The actual classification rule (overdue vs due-soon vs ok) is a
         small, pure, directly-tested module (utils/loanPolicy.js) — 8
         new tests, same pattern as every other threshold rule in this
         codebase. Reuses the existing generic Notification
         infrastructure from Slice 16 entirely — NotificationBell needed
         zero frontend changes, since it already renders any
         message/link generically; just extended the type enum
         ('due_soon', 'overdue') and added an optional bookId field for
         reliable duplicate-detection.
         Found two real things while building this: (1) the seeded
         "Clean Code" on_loan book had no currentHolderId at all — a
         genuinely unreturnable orphaned status that predates this
         slice, not something introduced by it. Fixed by giving it a
         real holder (the demo student) and a real due date timed to
         land inside the due-soon window, so logging in immediately
         demonstrates the new feature rather than requiring the user to
         manually borrow something first. (2) Documented explicitly,
         not silently: "Borrow Reminders" from the original spec
         overlaps with the already-real waitlist-ready notification from
         Slice 16 (a student is reminded the moment a book they're
         waiting for becomes available) — a separate "you have unused KC,
         go borrow something" nudge was considered and deliberately not
         built, since it's a speculative, lower-value feature with no
         clear spec backing, not a real gap.
         This closes the entire original spec audit. 8 new tests (92
         total, was 84), 0 new routes (existing endpoint extended, not a
         new one).
Slice 25 A second full re-check against the same spec, prompted directly
         by the user re-sending it and asking explicitly whether
         anything was still missed, plus a request to add an AI chatbot.
         Re-verified every section against the actual code rather than
         answering from memory. Found three genuine gaps that slipped
         through the first audit:
           - Student Dashboard had no "Sustainability Impact" section at
             all (spec lists it as a Student Dashboard sub-feature,
             distinct from the platform-wide /sustainability page). Added
             sustainabilityService.getPersonalImpact(userId), reusing the
             exact same BOOKS_PER_TREE/CO2_KG_PER_BOOK constants as the
             platform-wide version rather than reinventing the
             methodology — exported them instead of duplicating.
           - Recycler Dashboard had zero Revenue Tracking (Recycled Books
             + basic counts existed, nothing about money earned). Added a
             flat, honestly-labeled scrap value per recycled book
             (BookHistory gained a generic cashAmount field), with a real
             running total + per-book breakdown via a new
             recyclerService.getRevenue(recyclerId).
           - CSR's "Impact Reports" existed only as a flat activity list
             — defensible but thin. Extended getSponsorSummary with a
             category breakdown of sponsored books specifically (cash
             grants excluded, since a student can spend those on
             anything) — the exact same aggregation pattern as College's
             getOverview categoryBreakdown.
         On the chatbot ask specifically: confirmed by direct text search
         that the literal word "chatbot" does not appear anywhere in the
         spec provided. The only AI-related spec items are "OpenAI API
         compatible architecture" (a tech-stack note, not a feature) and
         AI Book Verification (already built). "KnowledgeBot" exists only
         in this project's own internal §5.1 planning notes from the very
         start — explicitly marked *(new)* even then, meaning it was
         always an addition beyond the literal spec, never committed to.
         Stated directly rather than silently complying: this is not a
         missed requirement, it would be new scope, and wasn't built
         without an explicit decision to do so.
         Closed the Documentation section of the spec, flagged honestly
         in the very first audit and then left unfinished for 7 slices
         while feature work took priority — a real instance of a known
         gap sitting open longer than it should have. Added: API.md (all
         74 endpoints), DEPLOYMENT.md (a real, practical guide for this
         exact stack — MongoDB Atlas + a Node host + a static frontend
         host), DATABASE_SCHEMA.md (all 16 collections, verified against
         the actual model files rather than written from memory —
         directly spot-checked Transaction.js and KCWallet.js against the
         draft to confirm accuracy before finalizing), a new
         ARCHITECTURE_OVERVIEW.md (the existing ARCHITECTURE.md is an
         884-line slice-by-slice build journal, not the concise system
         description the spec actually asks for — kept both, since the
         journal has its own real value), RESUME_BULLETS.md, and
         INTERVIEW_QA.md, all grounded in specifics from the actual build
         rather than generic template content.
         Found and fixed one more thing while in here: the README's
         "What's next" section still said Reserve/Waitlist was
         deferred — that shipped back in Slice 16. Nobody had reason to
         re-read that specific paragraph in 9 slices.
         2 new routes (74, was 72): GET /sustainability/me, GET
         /recycler/revenue. 0 new tests — getPersonalImpact and
         getRevenue are straightforward DB aggregations with no
         non-trivial branching logic worth extracting, consistent with
         how comparable functions elsewhere (getSponsorSummary,
         getScholarshipHistory) were never given dedicated tests either.
Slice 26 The AI Chatbot ("KnowledgeBot") — explicitly requested by the
         user after I flagged in Slice 25 that the literal word
         "chatbot" doesn't appear anywhere in the spec text, so this is
         honestly new scope by direct request, not a missed requirement
         being silently filled in.
         Built using the exact same honest mock-by-default pattern as
         aiService.js — same aiConfig.mock flag, same clear "this is
         where a real Gemini call would go" extension seam, console log
         already shared between both AI features since it's a
         module-level singleton import. The mock intelligence isn't
         generic canned text though: intent detection
         (utils/chatbotIntent.js, pure plain keyword matching, NOT a
         trained model — same "simple ranking, not AI" honesty as
         recommendationService.js, and directly unit tested, 10 new
         tests) decides what the user is asking about, then
         chatbotService.js goes and pulls REAL, live data to ground the
         answer: the actual BASE_KC/CATEGORY_BONUS constants for KC
         questions (so if those numbers ever change, the bot's answer
         updates automatically rather than going stale), the user's own
         currently-held books and real due dates for return questions,
         real available inventory counts for exam/recommendation
         questions. New ChatMessage model persists conversation history
         per user the same way every other activity in this app
         persists, not an ephemeral lost-on-refresh widget.
         Available to any authenticated role, not student-only — the
         core concepts it explains (KC economy, deposit/donate/sell/
         exchange) are relevant context regardless of role. A floating
         widget mounted globally in App.jsx, matching NotificationBell's
         established visual language (glass panel, same dark-mode
         classes throughout).
         Caught my own regression before shipping: mounting the widget
         eagerly added ~25KB to the main bundle (242.94KB -> 267.47KB),
         quietly undoing part of Slice 15's whole reason for existing.
         Lazy-loaded it the same way every page already is
         (React.lazy + Suspense, fallback=null) — back to 243.90KB,
         essentially the pre-chatbot baseline.
         2 new routes (76, was 74), 10 new tests (102, was 92).
         Also addressed directly, not silently passed over: the spec
         lists "Wallet Pages" as a distinct theme-application target
         from "Student Dashboard." There's no standalone /wallet route —
         wallet balance, transactions, and borrow/return all live
         embedded in the Student Dashboard, which is fully theme-aware
         (the same global ThemeContext + Tailwind dark: classes used
         everywhere). Judged this as satisfying the spec's actual
         intent (a themeable wallet UI exists and works) rather than the
         literal page count — building a separate route that just
         re-displays the same data already on the dashboard would be
         redundant, not a genuine gap closure. Flagged here rather than
         silently treated as already covered.
Slice 27 A real CI pipeline (GitHub Actions) — closing the one item
         that's sat on the "not yet built" list since Slice 17
         introduced the test suite: 102 tests existed, nothing ran them
         automatically. User's explicit choice from a short list of
         candidates (Carbon Certificate PDF and a Reviews/Ratings system
         were the other two offered; CI/CD won on the reasoning that it
         closes a gap already flagged repeatedly rather than adding new
         surface area, and is the stronger interview story — "I wrote
         tests" vs "I wrote tests AND they block anything that breaks
         them").
         .github/workflows/ci.yml, two jobs: server (npm ci, syntax-check
         every file individually — Vitest only loads files reachable
         from a test's import graph, so this catches what tests
         structurally can't — full test suite, then a real boot check)
         and client (npm ci, build, then a grep for any hardcoded
         localhost:5000 string in the output — the exact regression this
         project's own README documents from a real deployment session).
         Targets Node 22 specifically, matching what's actually been
         tested throughout this build, not a guess at broader
         compatibility never verified. Uses npm ci, not npm install,
         deliberately — the whole point of pinning exact dependency
         versions and shipping lockfiles (the original dependency-drift
         incident this project's history documents) is wasted if CI
         doesn't also enforce that the lockfile and package.json haven't
         drifted apart.
         Every single step was extracted and run locally exactly as
         written before considering this done, not just trusted because
         the YAML parsed. That caught a real bug: the boot-check script
         was originally written to /tmp/ but used a relative import
         (./app.js), which would have resolved to /tmp/app.js and failed
         in actual CI — caught by literally running the extracted script
         from /tmp/ first and watching it fail with exactly that error,
         then fixing it to write into the working directory instead. The
         localhost:5000 regression check was verified with equal rigor
         in the other direction: deliberately reintroduced that exact
         bug locally, confirmed the check fails as designed, reverted.
         No deploy step — wiring one would mean either committing real
         hosting credentials for a host not yet chosen, or claiming
         automation that doesn't exist; docs/DEPLOYMENT.md's manual guide
         stays the honest path until a real host is picked.
         Status badge added to the README with an explicit placeholder
         instruction, since the actual GitHub repo path isn't known from
         here. 0 new tests (the workflow automates existing verification
         rather than adding new checks to verify), 0 new routes.
Slice 28 A real, broadly-applied 3D design pass — user's explicit choice,
         framed as "premium and perfect," applied at the shared
         component level (BookCover, Card, Modal, Button, KCBalance,
         BookGrid, the Landing hero) rather than as one-off page effects,
         so it cascades consistently everywhere those components are
         already used instead of needing to be hand-applied per page.
         framer-motion (v11.18.2) was already an installed dependency,
         confirmed unused anywhere in the codebase before this slice —
         zero new dependencies needed. Tailwind v3.4 (confirmed the
         exact pinned version before answering) has no native 3D
         transform utilities — those came in v4 — so framer-motion's
         style props do the actual 3D math; Tailwind/Flexbox still
         handle everything structural, exactly the division of labor
         discussed with the user before building anything.
         What got built: real mouse-tracked 3D tilt + a cursor-following
         glare sheen on every book cover (layered onto the EXISTING
         page-thickness/spine-shadow illusion in BookCover.jsx, not
         replacing it); an opt-in tilt3d prop on Card, applied to all 27
         genuine stat/metric cards across every dashboard (deliberately
         NOT applied to list/content cards containing clickable buttons,
         e.g. Parent's children list — a tilting container around an
         interactive button would hurt usability, not help it); Modal
         entrances that swoop in from a 3D angle via AnimatePresence
         instead of a flat fade; Button press feedback with a genuine
         tactile depth illusion layered on the pre-existing
         active:scale-[0.98]; a real 3D coin-flip on KCBalance layered
         on the EXISTING, already-wired pulse-on-change behavior
         (extended, not replaced); BookGrid entries cascading in
         staggered with a slight 3D tilt, capped at a 10-item stagger
         window so infinite-scroll pagination can't accumulate
         ever-growing entrance delays on later pages; and a Landing-page
         hero parallax book stack using REAL, live available books
         fetched from the public /books endpoint — consistent with this
         project's standing "real data, not decoration" rule throughout
         — gracefully showing nothing if the fetch fails rather than
         faking cover art.
         Three real bugs caught through actually verifying each piece,
         not just trusting that code which "looks right" works:
           1. Initially called useTransform() inside a .map() callback
              in the Landing hero — a Rules of Hooks violation. Caught
              by installing eslint-plugin-react-hooks in an isolated
              scratch directory (kept out of the project's own
              dependencies) and running it directly against every new
              file; fixed by extracting each book's parallax layer into
              its own component so hooks are called at a stable
              top-level per instance, not conditionally per array item.
           2. Button's "as" prop (used for as={Link} navigation
              throughout the app) was initially wrapped with a buggy
              string-vs-fallback-to-div check that would have silently
              replaced React Router's real Link with a plain animated
              div for any non-string Component — breaking navigation
              entirely on every button using as={Link}. Caught before
              shipping by trying to verify it in a real headless browser
              (network egress to cdn.playwright.dev is blocked in this
              sandbox, confirmed directly rather than assumed, so an
              actual click-through test wasn't possible) — fell back to
              the strongest verification actually available: read
              framer-motion's own installed source directly and
              confirmed motion.create(Component) renders the real
              wrapped component via createElement with all real props
              forwarded, not a substitute. Fixed using motion.create(),
              the correct documented API for wrapping arbitrary custom
              components.
           3. The most serious one: an early App.jsx draft added a real
              MotionConfig wrapper for reduced-motion support, but the
              file that ended up in the working tree instead had an
              orphaned comment claiming a DIFFERENT strategy (per-
              component useReducedMotion() calls) — a strategy that was
              never actually implemented anywhere. Caught by the
              standing pre-slice stale-reference grep surfacing the
              comment, then directly checking how many files actually
              imported useReducedMotion (one — the comment itself, not
              real code). At that point in the build, zero new 3D
              effects respected the OS-level reduced-motion preference,
              a real regression against this project's own documented
              accessibility commitment. Fixed properly: implemented
              useReducedMotion() for real in all 7 affected
              files/components, verified each one branches correctly
              (BookCover/Card drop rotation but keep position;
              Modal/BookGrid fall back to a plain fade; Button drops the
              rotateX tilt; KCBalance skips the flip but keeps the
              color-based pulse glow, since that's not a motion effect),
              re-ran the Rules-of-Hooks check, corrected the App.jsx
              comment to match what's now genuinely true.
         Bundle impact, accounted for honestly: framer-motion settled
         into its own ~124KB chunk, separate from the main bundle (which
         is actually slightly smaller than before this slice — 235.92KB
         vs 243.90KB — Vite split more cleanly once the shared
         dependency graph stabilized). Comparable in scale to the
         already-accepted Recharts chunk (372KB, isolated to 2 pages),
         but framer-motion here serves nearly the entire app's
         interactive surface, not 2 pages — a reasonable trade for what
         was actually asked for. 0 backend changes this slice
         (confirmed: 102 tests, 76 routes, fully unchanged).
Slice 29 A second real-deployment debugging round, from the user actually
         running the Slice 28 build and hitting genuine issues — same
         pattern as the Slice 17 session, and once again surfaced things
         the sandbox alone couldn't have caught.
         Two genuine, real bugs found and fixed:
           1. Verification and password-reset emails sent only a bare
              raw token string ("Verify your email using this code/link:
              <token>"), but both frontend pages (VerifyEmail.jsx,
              ResetPassword.jsx) read the token from a URL query param
              (?token=...), expecting an actual clickable link. This was
              broken even with real SMTP configured, not just in dev
              console-log mode — confirmed by tracing both sides (the
              email body construction in authService.js and the
              useSearchParams().get('token') read on both frontend
              pages) before fixing. Fixed all three call sites
              (register, resend-verification, forgot-password) to build
              a real `${CLIENT_URL}/verify-email?token=...` /
              `/reset-password?token=...` link. Verified two ways: the
              link-building logic directly (confirmed it produces
              exactly the URL shape both frontend pages expect), and the
              dev-mode console fallback's existing HTML-stripping logic
              against the new body (confirmed it now prints a real,
              paste-able URL instead of a bare hex string).
           2. BookCover's onError-only missing-image detection (the
              Slice 18 fix) wasn't fully robust — it only catches a
              genuine network/HTTP failure. An image that technically
              "succeeds" at the network layer but is a degenerate
              placeholder (e.g. Open Library serving a 1x1-class image
              under some edge case the existing ?default=false fix
              doesn't cover) never fires onError, so it was rendering as
              an invisible box over the card's own light-gray background
              color — exactly the "blank silver screen" the user
              described for some covers, as distinct from the navy-
              gradient fallback (which would look like a dark box, not
              silver) — that distinction is what pointed at onError
              never firing as the actual mechanism, not a fresh Open
              Library coverage gap. Hardened with a second, independent
              check: an onLoad handler validates naturalWidth/
              naturalHeight are real (>20px), treating a degenerate
              image the same as a genuine error. Honest limitation
              stated directly rather than glossed over: covers.
              openlibrary.org isn't reachable from this sandbox to
              empirically confirm live behavior per ISBN (network
              egress restriction, and the fetch tool here only works
              against prior search results) — this is the most robust,
              defensible fix achievable without that, not a fix
              verified against the exact live failure.
         Two things explained rather than "fixed", since they weren't
         bugs: the CSRF-validation 403 on the very first /auth/refresh
         call is the same expected, harmless silent-session-restore
         attempt documented back when notification/wallet pages were
         built — nothing to act on. The "wrong account already logged
         in" surprise on a fresh visit is standard cookie-based session
         persistence (a prior demo account's refresh cookie silently
         restoring that session) working as designed, not a bug — but
         genuinely confusing for someone switching between demo accounts
         a lot, which is exactly what motivated the next item.
         One real, deliberate UX addition, directly requested: a Demo
         Accounts panel on the Login page, listing all 7 seeded accounts
         with click-to-fill (one shared password, shown openly). This
         also meaningfully reduces the "which account am I in" confusion
         from the previous paragraph, by making it trivial to
         deliberately pick an account rather than wonder which one a
         restored session belongs to. Explicitly labeled and commented
         as a demo-only affordance — a real product would never put
         credentials on its own login page, and the code says so
         directly, not just in this build log.
         Verification for this slice followed the same standard
         discipline throughout (full syntax check, Rules-of-Hooks static
         check on every touched file via the same isolated-scratch-
         directory ESLint pattern established in Slice 28, full 102-test
         suite, fresh build, live route sweep) plus one direct functional
         check: ran the actual link-building logic in isolation and
         confirmed the generated URL exactly matches what both frontend
         pages require. 0 new routes, 0 new tests (both fixes are
         template-string construction and DOM-event-driven component
         behavior, neither a meaningful unit-testable branch point by
         this project's own established pure-logic-only testing
         pattern), 102 tests / 76 routes unchanged and reconfirmed.
```

**Not yet built, regardless of what §5.1 calls them:** Leaderboard/Badges/Reviews, Study Groups/Bundles/Auction, i18n/PWA, the Carbon Certificate PDF, and the Alumni donation drive. RFID is done as of Slice 18; real Deposit/Donate/Sell/Exchange flows are done as of Slice 19; all 9 Government Exam categories have real inventory as of Slice 20; College Scholarship Management + Demand Forecasting are done as of Slice 21; Super Admin Fraud Detection is done as of Slice 22; CSR Sponsored Books are done as of Slice 23; Return reminders are done as of Slice 24, closing the entire spec audit prompted directly by the user; the personal Sustainability Impact / Recycler Revenue Tracking / CSR Impact Report gaps found on re-check plus the full Documentation set are done as of Slice 25; the AI Chatbot is done as of Slice 26 (explicit new scope by direct request — never part of the literal spec, confirmed by direct text search); CI/CD (test automation, not auto-deploy) is done as of Slice 27. The items in this paragraph are real, deliberate scope boundaries — breadth that was never part of closing identified gaps — not hidden ones; each is also called out honestly in the relevant README or stub component.

---

## 6. Folder Structure

```
svbbs/
├── client/                          # React (Vite, JS only)
│   ├── public/
│   │   ├── manifest.json            # PWA
│   │   └── service-worker.js
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── layout/              # Navbar, Sidebar, Footer, ThemeToggle, RoleShell
│   │   │   ├── ui/                  # Button, Card, Modal, Badge, Input, Toast, Counter, Skeleton, ImageUpload
│   │   │   ├── books/               # BookCover, BookCard, BookShelf, BookDetail, ConditionPhotos, HistoryLedger, InfiniteScrollGrid
│   │   │   ├── wallet/              # KCBalance, HybridPayment, Receipt, TransactionRow
│   │   │   ├── dashboard/           # StatCard, ChartPanel, ActivityFeed
│   │   │   ├── ai/                  # VerificationResult, KnowledgeBot, CompanionSummary
│   │   │   ├── rfid/                # ScannerPanel, ScanHistory, QRBadge
│   │   │   ├── sustainability/      # ImpactGauge, TreeCounter, CertificateCard
│   │   │   └── charts/              # LineChart, BarChart, DonutChart wrappers (Recharts)
│   │   ├── context/                 # AuthContext, ThemeContext, WalletContext, NotificationContext, LangContext
│   │   ├── pages/
│   │   │   ├── public/              # Landing, Login, Register, Verify, ResetPassword, NotFound
│   │   │   ├── student/             # Dashboard, Marketplace, MyBooks, Wallet, ExamHub, Passport, StudyGroups
│   │   │   ├── vendor/              # Inventory, VerificationQueue, RFID, Transactions, Reviews
│   │   │   ├── college/             # Analytics, Sustainability, Scholarships, Forecast
│   │   │   ├── superadmin/          # Users, Analytics, Fraud, KCEconomy
│   │   │   ├── recycler/            # RecycledBooks, Revenue, Metrics
│   │   │   ├── csr/                 # SponsoredStudents, SponsoredBooks, Impact
│   │   │   └── parent/              # ChildOverview, TopUp, ImpactView
│   │   ├── data/                    # seedBooks.js (real covers), exams.js, badges.js
│   │   ├── hooks/                   # useAuth, useTheme, useWallet, useFetch, useReducedMotion
│   │   ├── services/                # api.js (axios), authService, bookService, kcService, aiService
│   │   ├── locales/                 # en, hi, te, ta  (i18n)
│   │   ├── utils/                   # formatKC, formatDate, calcImpact, validators
│   │   ├── App.jsx
│   │   ├── routes.jsx               # role-based route guards
│   │   └── main.jsx
│   ├── tailwind.config.js           # full design-token system
│   ├── postcss.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                          # Node + Express (JS only)
│   ├── config/                      # db.js, env.js, mailer.js, gemini.js, cloudinary.js
│   ├── models/                      # User, Session, MFA, LoginAttempt, Book, BookHistory,
│   │                                #   Transaction, KCWallet, Reservation, Waitlist, RFIDTag,
│   │                                #   ExamCategory, StudyGroup, Bundle, Auction, Review, Badge,
│   │                                #   Notification, AuditLog, Dispute, Sponsorship, Certificate, BookRequest
│   ├── routes/                      # one router per domain (auth, books, kc, ai, rfid, exams, ...)
│   ├── controllers/                 # thin: parse req, call service, send res
│   ├── services/                    # business logic: kcService, paymentService, aiService, uploadService,
│   │                                #   pdfService, rfidService, sustainabilityService, fraudService, notifyService
│   ├── middleware/                  # auth(JWT verify), rbac, ownership, validate(Joi), upload(multer),
│   │                                #   rateLimiter, lockout, captcha, csrf, sanitize, paginate,
│   │                                #   securityHeaders, errorHandler, auditLogger
│   ├── utils/                       # token.js, hash.js, kcRules.js, impactCalc.js, response.js
│   ├── seeds/                       # seedUsers, seedBooks, seedExams, seedBadges
│   ├── app.js                       # express app + middleware chain
│   └── server.js                    # entry, db connect, listen
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md                  # schema + relationships + indexes
│   ├── API.md                       # every endpoint
│   ├── DEPLOYMENT.md
│   ├── RESUME.md                    # bullet points
│   └── INTERVIEW.md                 # Q&A
│
├── README.md
└── .env.example
```

---

## 7. Data Model (core collections)

| Collection | Key fields | Notes |
|---|---|---|
| **User** | role, name, email, passwordHash, collegeId, isVerified, kcWalletId, badges[], parentId, mfaEnabled | RBAC by `role` enum |
| **Session** | userId, refreshTokenHash, tokenFamilyId, device, ip, location, lastSeen, expiresAt, revoked | enables true logout, active-session list, reuse detection |
| **MFA** | userId, totpSecret (encrypted), backupCodes[] (hashed), enabled | TOTP + recovery codes |
| **LoginAttempt** | email/ip, success, timestamp, reason | lockout + anomaly detection |
| **Book** | title, author, isbn, category, examTags[], `coverImage`, `conditionPhotos[]`, condition, aiScore, kcValue, status, ownerId, rfidTag, qrCode, currentHolderId | status = available / on-loan / reserved / recycled |
| **BookHistory** | bookId, event, fromUser, toUser, condition, kcAmount, timestamp | the public Ledger that travels with the book |
| **KCWallet** | userId, balance, lockedBalance (escrow) | balance in KC |
| **Transaction** | userId, type, kcAmount, cashAmount, bookId, status, receiptId | hybrid payment record |
| **Reservation / Waitlist** | bookId, userId, position, expiresAt | |
| **RFIDTag** | tagId, bookId, lastScan, scanHistory[] | |
| **ExamCategory** | name, overview, recommendedBooks[], availableBooks[] | seeded per exam |
| **StudyGroup / Bundle / Auction** | members[], books[], bids[] | engagement features |
| **Review / Badge / Notification** | — | gamification + alerts |
| **Dispute** | bookId, reporter, status, escrowTxn | damage flow holds KC in escrow |
| **Sponsorship / Certificate / BookRequest** | — | CSR, carbon cert, pre-order board |
| **AuditLog** | actor, action, target, ip, timestamp | security |

**Indexes:** `Book.isbn`, `Book.category + status` (compound, for fast shelf filtering), `User.email` (unique), `Transaction.userId + createdAt`, `RFIDTag.tagId` (unique), text index on `Book.title + author` for search.

---

## 8. KC Economy Rules (encoded in `kcRules.js`)

| Condition | Base KC | Bonus |
|---|---|---|
| Excellent | 300 | Engineering +50, Govt exam +50 |
| Good | 200 | Medical +75 |
| Average | 100 | Rare +100 |
| Poor | 25 | — |

**Hybrid payment:** `cashDue = max(0, bookCostKC − walletKC) × KC_TO_RUPEE`. Deduct available KC first, charge cash for the remainder, write one Transaction, emit one Receipt.

**Anti-abuse (fraud service):** velocity checks (too many deposits too fast), AI-score vs. self-claimed-condition mismatch flags, and duplicate ISBN-RFID detection — all surface on the Super Admin fraud panel.

---

## 9. Authentication & Security (Production-Grade Spec)

This is the authoritative auth design — built to OWASP ASVS / Authentication Cheat Sheet standards. **Session model decision:** stateless JWT **plus** a server-side session/refresh store, so true logout, "view active sessions", and refresh-token reuse detection all work for real (pure stateless JWT can't revoke).

### 9.1 Express middleware chain
```
helmet(CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
  → cors(strict allowlist) → rateLimiter → cookieParser → csrf
  → express.json(size-limited) → route → validate(Joi, server-side)
  → auth(JWT verify) → rbac(role) → ownership check → controller → service
  → auditLogger → errorHandler(generic to client, detailed to server log)
```

### 9.2 Login protection
- Per-account + per-IP rate limiting on `/login`
- Temporary account lock after N failed attempts
- Progressive delay (exponential backoff) on repeated failures
- CAPTCHA challenge triggered by suspicious activity
- IP-based throttling and monitoring
- **Timing-safe**: constant-time credential comparison + uniform response delay so timing never leaks whether an email exists

### 9.3 Signup & verification
- Mandatory email verification (single-use expiring token)
- Strong password policy + **breached-password check (HIBP k-anonymity range API)**
- Rate-limited signup
- **No email enumeration**: same generic "check your inbox" response whether or not the email exists; duplicate-account notice is revealed only inside the email itself

### 9.4 Session security (JWT)
- Access token: short-lived (15 min), held **in memory** on the client (never localStorage — XSS-readable)
- Refresh token: HttpOnly + Secure + SameSite cookie, backed by a server-side `Session` record
- Token rotation on every refresh
- **Refresh-token reuse detection**: presenting an already-rotated token revokes the entire token family (theft signal)
- Logout invalidates the server-side session immediately
- Token signature + expiry validated on every request; compromised tokens revocable

### 9.5 Password reset
- Expiring, single-use tokens, **stored hashed** server-side
- No "email exists" leak
- All active sessions invalidated after a successful reset
- Reset attempts rate-limited and logged

### 9.6 Multi-Factor Auth (MFA)
- TOTP authenticator apps preferred over SMS OTP
- Backup recovery codes (hashed, single-use)
- **Step-up auth** required for critical actions (wallet payout, role change, large KC transfer)
- Recovery flows rate-limited and logged as hard as login (a top hijack vector)

### 9.7 Authorization (access control)
- RBAC for all 6 roles, verified on **every** protected route (never frontend-only)
- Resource **ownership checks** (a student can only act on their own books/wallet)
- Least-privilege by default

### 9.8 Account security & device awareness
- Notify users of new-device / new-location logins
- "View active sessions" + remote logout (powered by the server-side Session store)
- Re-authentication required for sensitive profile/security changes

### 9.9 Backend / API hardening
- Validate + sanitize all input server-side (Joi)
- NoSQL-injection protection (Mongoose strict schemas, `express-mongo-sanitize`)
- CSRF protection on state-changing routes
- Secure CORS allowlist; HTTPS everywhere + HSTS; HTTP→HTTPS redirect in production

### 9.10 Logging, audit & monitoring
- Track failed logins, unusual location/device, suspicious behavior alerts
- Every auth/authorization event written to `AuditLog`
- **Never log** passwords, tokens, OTPs, or reset codes
- Audit trail for all critical actions; periodic review baked into the deployment doc

### 9.11 New collections this requires
- **Session** — userId, refreshTokenHash, tokenFamilyId, device, ip, location, lastSeen, expiresAt, revoked
- **MFA** — userId, totpSecret (encrypted), backupCodes[] (hashed), enabled
- **LoginAttempt** — email/ip, success, timestamp, reason (for lockout + anomaly detection)

Passwords: bcrypt (12 rounds). Reset/verification/backup tokens: hashed before storage. Secrets encrypted at rest.

---

## 10. AI Layer — The Intelligence Engine

AI is the differentiator, so it gets its own dedicated layer. Everything runs through one swappable `aiService` (Gemini primary, OpenAI-compatible shape) with a `MOCK_AI=true` flag that returns realistic canned responses — so the whole app **runs and demos beautifully without any paid API key**.

### 10.1 Core AI Features (already planned)
- **AI Book Verification** — `verifyBook(images)` → `{ title, isbn, authenticity, condition, aiScore, kcRecommendation, report }`
- **Personalized Recommendations** — `recommend(profile, history)` → ranked books with reasons
- **KnowledgeBot chatbot** — `chat(message, context)` → guidance + exam advice
- **Digital Book Companion** — `companionSummary(book)` → chapters, topics, PYQ mapping

### 10.2 New AI Features (added now)

| Feature | What it does | Why it impresses |
|---|---|---|
| **AI Price & KC Estimator** | Snap a photo of any book → instant fair KC value + cash equivalent, before you even deposit | Removes guesswork, feels magical |
| **AI Cover Scanner (OCR)** | Auto-fills title, author, ISBN, edition from a single cover photo | No manual typing — premium onboarding |
| **AI Condition Grader with heatmap** | Highlights wear, spine damage, water marks on the photo with a visual overlay + confidence % | Transparent, trustworthy, looks high-tech |
| **AI Study Planner** | Pick an exam + date → generates a week-by-week book + topic schedule | Turns a book app into a prep companion |
| **AI Exam Predictor** | Suggests which books matter most for an upcoming exam based on past trends | Real student value |
| **AI Duplicate / Fraud Detector** | Flags re-uploaded covers, mismatched ISBN-RFID, condition lies | Powers the Super Admin fraud panel |
| **AI Demand Forecaster** | Predicts which books colleges will need next semester | Headline feature for College Admin dashboard |
| **Semantic Search** | "Best book for thermodynamics basics" → understands meaning, not just keywords | Feels like Google, not a filter |
| **AI Summary on every book detail** | One-paragraph "what's inside + who it's for" auto-generated | Helps decide before borrowing |
| **AI Negotiation Assistant** | In auctions/exchanges, suggests a fair KC offer | Unique, conversational |
| **Voice KnowledgeBot** | Speak your request; AI replies (Web Speech API) | Accessibility + wow factor |
| **AI Sustainability Coach** | "You've saved 4 trees — donate 2 more to hit your monthly badge" | Ties AI to the green mission |

### 10.3 The AI Interface (clean + swappable)
```
aiService
 ├─ verifyBook(images)          ├─ recommend(profile, history)
 ├─ estimateKC(image)           ├─ studyPlan(exam, targetDate)
 ├─ scanCover(image)            ├─ predictExamBooks(exam)
 ├─ gradeCondition(images)      ├─ detectFraud(submission)
 ├─ forecastDemand(college)     ├─ semanticSearch(query)
 ├─ summarize(book)             ├─ negotiate(context)
 └─ chat(message, context)      └─ sustainabilityCoach(impact)
```
Each method has a mock implementation, so the app is fully demoable offline. A single env swap moves to live Gemini.

### 10.4 How AI *looks* premium
AI moments get a consistent visual signature: a subtle **gradient-bordered "AI" panel**, a typing/streaming reveal for generated text, a thinking shimmer while processing, and confidence scores shown as elegant thin progress rings — never raw JSON. The AI never feels like a chatbot bolted on; it feels woven into the product.

---

## 11. Documentation Deliverables

Every doc in `/docs` gets written: architecture diagram (described + ASCII), full DB schema, complete API reference, deployment guide (MongoDB Atlas + Render/Railway backend + Vercel frontend), README with setup steps, resume bullet points, and an interview Q&A bank covering the KC economy, RBAC, JWT refresh strategy, and the AI verification design.

---

## 12. What "Runnable" Means at Each Stage

- Mock AI + mock payment by default → no paid keys needed to run or demo.
- Seed scripts populate real users (one per role), real book covers, and every exam category → the app is never empty.
- One command per side: `npm run dev` (client) and `npm run dev` (server).

---

## 13. Implementation Gaps Closed (added on review, before Slice 0)

A second pass over the plan surfaced five structural gaps. Decisions below so nothing gets retrofitted mid-build:

### 13.1 Image upload pipeline (real photos, not just seed data)
Seed data uses Open Library covers, but real users need to upload real photos — a vendor depositing a book, a student submitting condition photos for AI verification.
- **`multer`** handles multipart upload on the server, **Cloudinary** (free tier) stores the images and serves optimized/resized versions.
- A dedicated `uploadService` wraps this so any feature (book deposit, AI verification, dispute evidence) calls one `uploadImage(file)` function.
- Client-side: drag-and-drop or camera-capture component with instant preview, used in the deposit flow and dispute flow.

### 13.2 PDF generation (receipts, certificates, Academic Passport)
- **`pdfkit`** on the server generates all official documents — receipts, the Carbon Credit Certificate, and the Academic Passport — so they're consistent, emailable, and downloadable from any device, not dependent on client rendering.
- Each is a designed template (logo, typography from the design system, a verification footer) rather than plain text dumped into a PDF.

### 13.3 Pagination
Marketplace, Exam Hub, and Inventory lists use **page-based pagination** (`?page=&limit=`) backed by indexed Mongo queries, with **infinite scroll** on the frontend (loads the next page as you near the bottom) rather than numbered pages — fits the shelf-browsing feel better than a paginated table would.

### 13.4 Accessibility (made explicit, not assumed)
Since the original brief requires "accessibility compliant" theming, this is now a concrete checklist applied across every component, not just the theme:
- Visible keyboard focus rings on every interactive element
- ARIA labels on icon-only buttons (theme toggle, close buttons, scanner controls)
- Color contrast meets WCAG AA in both Light and Dark themes (checked against the token palette directly)
- All motion respects `prefers-reduced-motion`
- Forms have associated labels and error messages tied via `aria-describedby`

### 13.5 Deferred to a later slice (not forgotten, just sequenced later)
- **Testing** — Jest + Supertest (backend), React Testing Library (frontend) — added as part of Slice 16 alongside production hardening, so tests are written against real, finished features rather than scaffolding.
- **CI/CD** — a basic GitHub Actions workflow (lint + test on push) added once the repo is initialized.
- **Real-time updates** — notifications and the vendor RFID scan screen start on REST polling for simplicity; Socket.io is a clean upgrade path noted for later if the polling feel isn't live enough.
- **Global error boundary + 404 page** — included in Slice 0 itself (it's small enough to do now).

This is the plan. When you say go, I'll start at **Slice 0** (scaffold + design system + theme + layout shell), show it to you, then move through the slices in order. Each slice arrives as real, runnable files — not snippets.

Tell me:
1. Start building from Slice 0, or
2. Adjust anything in this plan first (design direction, feature priorities, build order).
