# Resume Bullet Points

Pick and adapt — these are written specific and metric-grounded on purpose; generic versions are weaker on a resume. Swap numbers if the project changes after this point.

## Headline / summary line options

- Built **SVBBS**, a full-stack MERN platform modeling a campus book-sharing economy across 7 user roles, with a custom Knowledge Credit currency, hybrid KC+cash payments, and 74 REST endpoints covering everything from AI-assisted condition verification to fraud detection.
- Architected and shipped a production-style MERN application from scratch — JWT auth with refresh-token rotation and MFA, role-based access control across 7 distinct dashboards, and a 92-test automated suite — incrementally across 24 build phases.

## Architecture & backend

- Designed a role-based access control system across 7 user types (student, vendor, college admin, super admin, recycler, CSR sponsor, parent), enforcing every authorization boundary server-side rather than relying on frontend route guards.
- Built a custom virtual-currency economy (Knowledge Credits) with condition- and category-based reward calculation, hybrid KC+cash checkout, and atomic MongoDB transactions on every money-moving operation to eliminate race conditions on borrow, return, sale, and waitlist promotion.
- Implemented JWT authentication with short-lived access tokens, HttpOnly refresh-token rotation, TOTP-based MFA, progressive account lockout, and a full audit log — all server-enforced, with rate limiting, CSRF protection, and Helmet security headers on every route.
- Designed and shipped 74 REST endpoints across 17 route modules, each backed by Joi server-side validation independent of client-side checks.

## Specific features worth naming directly

- Built a real-time-feeling reservation/waitlist system using atomic `findOneAndUpdate` guards instead of a background scheduler, deliberately avoiding the operational fragility of a cron-based architecture.
- Implemented honest, heuristic-based fraud detection (credential-stuffing IP detection, early-warning account-attack thresholds below the real lockout point, and transaction-velocity anomaly flagging) using only the platform's own existing audit data — no third-party fraud API, no black-box scoring.
- Designed a two-sided book exchange system with atomic accept/decline logic that re-validates both sides of a swap are still available at acceptance time, preventing stale-proposal races.
- Built a due-date and return-reminder system computed on-demand at natural request boundaries rather than via a background job, with cooldown-based de-duplication — a deliberate architectural choice documented and defended in the project's own README.
- Built an AI assistant feature with a clean separation between intent classification (a pure, independently unit-tested keyword-matching module) and response generation, grounding every reply in live database queries — actual pricing rules, the user's own real due dates, real inventory — rather than static canned text, with a documented extension point for swapping in a real LLM call.

## Testing & engineering discipline

- Wrote and maintained a 92-test Vitest suite covering business-critical logic (KC pricing rules, password policy, waitlist FIFO ordering, fraud-signal thresholds, due-date classification) by extracting pure functions out of database-bound services specifically to make them independently testable.
- Found and fixed a TLD-validation bug that silently broke login for every demo account in a live deployment, caught only because of an end-to-end test against a real database — added permanent regression tests so the class of bug can't reappear silently.
- Diagnosed and resolved a dependency-resolution issue where unpinned `^` version ranges caused a fresh `npm install` to silently pull a breaking major version of a core build tool; resolved by pinning every dependency to its exact tested version and shipping lockfiles.

## Process / methodology (good for "tell me about your process" follow-ups)

- Built the application incrementally across 27 distinct, independently-verified delivery slices, each with its own fresh-install verification (syntax check, full test suite, server boot, client build, live route sweep) before being considered complete.
- Conducted a full feature-by-feature audit against the original product specification, identifying and closing real gaps (RFID tracking, the donate/sell/exchange flows, fraud detection, scholarship management) rather than declaring the project complete prematurely.
- Closed the project's CI/CD gap with a GitHub Actions pipeline that doesn't just run tests — it automates the same manual verification process (syntax checking, test suite, server boot, build verification, plus a targeted regression check for a specific bug found during a real deployment) used throughout development, run and individually verified locally before ever pushing to a CI environment.
