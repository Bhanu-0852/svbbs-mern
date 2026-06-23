# Interview Questions & Answers

Real questions an interviewer would plausibly ask about this specific project, with answers grounded in actual decisions made during the build — not generic talking points. Practice saying these in your own words rather than memorizing verbatim.

---

### "Walk me through your authorization model. How do you know a vendor can't access a student's wallet?"

Every protected route is gated by two middleware layers: `requireAuth` (validates the JWT, attaches the real user document to the request) and `requireRole('vendor')` (or whichever role). But the more important detail is that the frontend route guards are explicitly documented in the code as "convenience only" — the actual boundary is server-side on every single request. I tested this directly rather than assuming it: for example, when I built Sell and Exchange book listings, I confirmed that the normal borrow endpoint genuinely rejects a request to borrow a Sell-listed book at the database query level, not just by hiding the button in the UI.

### "How do you prevent two people from borrowing the same book at the same time?"

Atomic `findOneAndUpdate` with the precondition baked directly into the filter, not a separate read-then-write. For example, borrowing a book does `Book.findOneAndUpdate({ _id, status: 'available' }, { status: 'on_loan', ... })` in one atomic operation — if two requests race, only one will match the filter (since the first one already flipped the status), and the second gets a clean 409 rather than corrupting state. I used this same pattern everywhere two people could plausibly race: waitlist promotion, RFID scans, exchange acceptance, recycling a book.

### "Why didn't you use a background job scheduler for things like reservation expiry or return reminders?"

Deliberately. A scheduler that isn't actually running reliably in the deployment environment is worse than not promising the feature at all — it's the difference between an honest limitation and a feature that silently doesn't work. Instead, time-based logic is computed live, on demand, at a natural request boundary that already happens anyway. For return reminders specifically: the check runs inside the same endpoint a student's dashboard already calls every time it loads (`GET /wallet/my-books`), with a cooldown to stop it from re-notifying on every page visit. It's not real-time in the sense of firing the instant a deadline passes, but it's honest about what it actually does, and it's documented as a deliberate trade-off, not hidden.

### "Tell me about a bug you found that wasn't obvious."

Joi's `.email()` validator checks the domain's TLD against a real-world allowlist by default. Every demo account in this project uses a `.demo` email domain, which isn't a real TLD — so every single demo login was silently rejected with a generic "must be a valid email" error. This never surfaced in development because there was no live database connection available to test a full end-to-end login request until deployment. The fix was a one-line Joi option (`tlds: { allow: false }`), but finding it required actually tracing the validation chain rather than assuming the bug was somewhere in the auth logic itself. I added permanent regression tests afterward specifically pinning down that all the demo accounts validate correctly, so the same class of bug can't silently reappear.

### "How did you handle the hybrid payment system — partly credits, partly cash?"

The book has a fixed KC cost. At borrow time, the system deducts `min(walletBalance, kcCost)` from the wallet, and whatever's left becomes `cashDue`. Both numbers are stored on the transaction record, not just computed and displayed — so the transaction history is an honest, permanent record of exactly how much KC versus cash was used, not a number that could drift from reality. I extended this same model later for CSR-sponsored borrows, where `kcUsed` and `cashDue` are both legitimately zero because a sponsor covered the full cost outside the student's own wallet — a separate `sponsoredBy` field traces who actually paid, kept distinct rather than overloading the existing fields with an inferred meaning.

### "What would you do differently if you started over?"

I'd add the `dueDate` concept to borrows much earlier. It turned out to be a genuine prerequisite for return reminders, but borrowing had been fully open-ended (no deadline at all) for most of the build — I only discovered that gap when I went to build the reminder feature properly and realized there was nothing to actually check a deadline against. It's the kind of thing that's obvious in hindsight but easy to miss when you're building the "happy path" borrow flow first and circling back to edge cases later.

### "How do you handle data integrity when re-seeding the database?"

This took more thought than I expected. The seed script wipes and regenerates demo data on every run, but several collections reference each other — RFID tags and transactions reference books, scholarships and sponsorships reference users. Books get fully recreated on reseed (new IDs), but users are upserted (stable IDs). That asymmetry meant I had to be deliberate about which collections need wiping for which reason: book-referencing collections need wiping because the books they point to literally won't exist anymore after a reseed; wallet-referencing collections need wiping for a different reason — because wallet balances reset unconditionally on reseed, so leaving old grant records around would make a "total KC granted" stat lie about money that's no longer actually in anyone's wallet.

### "What's something in this project you're not fully happy with, and why didn't you fix it?"

The recycling "revenue" is a flat per-book scrap value, not anything connected to real material pricing — a genuine recycler would price by weight and material type, which this platform has no way to model without external data it doesn't have. I documented that limitation directly in the UI itself rather than presenting a flat estimate as if it were precise. It's a reasonable simplification for a portfolio project, but I'd flag it as exactly that if asked, rather than letting the number look more authoritative than it actually is.

### "How did you approach testing in a project without a live database in your development environment?"

I leaned heavily on extracting pure logic out of database-bound service functions specifically so it could be tested directly — the actual classification rules (is this book due soon or overdue, does this IP's failed-login pattern look like credential stuffing, what's the next state in a waitlist queue) all live in small, dependency-free modules with direct unit tests. The database-touching parts (the actual Mongo queries and atomic updates) get verified through live boot tests, route-level auth checks, and — once a real deployment existed — actual end-to-end testing against production data, which is exactly what caught the TLD validation bug mentioned earlier.
