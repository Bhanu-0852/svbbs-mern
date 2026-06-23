# Database Schema Documentation

17 Mongoose collections, MongoDB Atlas. Generated from the actual model files in `server/models/` — if this ever drifts from the code, the code wins.

## Entity relationship overview

```
User ──┬──< Book (ownerId, currentHolderId)
        ├──< KCWallet (1:1, userId)
        ├──< Transaction (userId)
        ├──< Notification (recipientId)
        ├──< WaitlistEntry (userId)
        ├──< Sponsorship (sponsorId, studentId)
        ├──< Scholarship (collegeAdminId, studentId)
        ├──< RfidTag (vendorId)
        ├──< ExchangeProposal (proposerId, targetOwnerId)
        ├──> College (collegeId, many students : 1 college)
        └──> User (parentId, self-reference for parent-child)

Book ──┬──< BookHistory (bookId)
        ├──< Transaction (bookId)
        ├──< WaitlistEntry (bookId)
        ├──1:1── RfidTag (bookId)
        └──< ExchangeProposal (targetBookId, offeredBookId)
```

---

## Identity & access

### User
The central identity record across all 7 roles — role-specific fields coexist on one schema rather than separate collections per role, since a user is fundamentally one entity regardless of role.

| Field | Type | Notes |
|---|---|---|
| `name`, `email`, `passwordHash` | String | `email` unique + indexed |
| `role` | enum | student / vendor / college_admin / super_admin / recycler / csr_sponsor / parent |
| `collegeId` | ObjectId → College | null unless student/college_admin |
| `collegeVerified` | Boolean | |
| `parentId` | ObjectId → User | self-reference, student → their linked parent |
| `isVerified`, `isActive` | Boolean | email verification + admin suspension |
| `kcWalletId` | ObjectId → KCWallet | |
| `mfaEnabled` | Boolean | |
| `failedLoginCount`, `lockedUntil` | Number, Date | progressive lockout state |
| `emailVerificationTokenHash`, `passwordResetTokenHash` | String | hashed, never raw — single-use, expiring |

Indexes: `email` (unique), `role`, compound `{ role, collegeId }`.

### College
| Field | Type |
|---|---|
| `name`, `city`, `code` | String |

### Session / LoginAttempt / MFA / AuditLog
Security-adjacent records: `Session` (active refresh-token sessions per device), `LoginAttempt` (every login try, success or fail, with `email`/`ip`/`reason` — the raw data fraud detection reads), `MFA` (encrypted TOTP secret), `AuditLog` (`actorId`, `action`, `target`, `ip`, `userAgent`, `metadata` — every meaningful action in the app writes one of these).

---

## Books & lending

### Book
The core entity. One document per physical book in the system.

| Field | Type | Notes |
|---|---|---|
| `title`, `author`, `isbn`, `edition`, `description` | String | |
| `categoryTags` | [String] | engineering / medical / government_exam / rare / arts / science / general |
| `examTags` | [String] | e.g. `['UPSC', 'GATE']` |
| `coverImage`, `conditionPhotos` | String, [String] | real Open Library covers |
| `condition` | enum | excellent / good / average / poor |
| `aiScore`, `aiConditionReport` | Number, String | from AI verification |
| `kcValue` | Number | computed at deposit time |
| `status` | enum | available / on_loan / reserved / recycled / sold |
| `ownerId` | ObjectId → User | who deposited it |
| `currentHolderId` | ObjectId → User | set only while on_loan |
| `dueDate` | Date | set on borrow, cleared on return |
| `reservedForUserId` | ObjectId → User | set only while reserved, for waitlist claims |
| `depositMethod` | enum | deposit / donate / exchange / sell — each has genuinely different behavior, not just a label |
| `salePrice` | Number | only set when depositMethod is sell |

Indexes: text index on `title`+`author` (search), compound `{ categoryTags, status }`, compound `{ examTags, status }`.

### BookHistory
Append-only ledger — every meaningful event in a book's life, in order. This is what powers the public "History Ledger" on every book detail page.

| Field | Type |
|---|---|
| `bookId` | ObjectId → Book |
| `event` | enum: deposited / verified / borrowed / returned / exchanged / donated / recycled / scanned / rfid_registered / rfid_checked_out / rfid_checked_in / sold |
| `fromUserId`, `toUserId` | ObjectId → User |
| `condition`, `kcAmount`, `cashAmount`, `note` | mixed |

### WaitlistEntry
| Field | Type |
|---|---|
| `bookId`, `userId` | ObjectId |
| `status` | waiting / ready / claimed / cancelled |

FIFO ordering via `createdAt` — no priority field, oldest entry wins, by design.

### ExchangeProposal
A direct 1:1 swap proposal between two students' books.

| Field | Type |
|---|---|
| `targetBookId`, `offeredBookId` | ObjectId → Book |
| `proposerId`, `targetOwnerId` | ObjectId → User |
| `status` | pending / accepted / declined / cancelled |

---

## The KC economy

### KCWallet
One per user. Just a `userId` and a `balance` — deliberately minimal; the actual history of how that balance got where it is lives in `Transaction`, `Sponsorship`, and `Scholarship`, not duplicated here.

### Transaction
Every borrow or sale that moves KC or cash.

| Field | Type | Notes |
|---|---|---|
| `userId`, `bookId` | ObjectId | |
| `type` | enum | borrow / sell |
| `kcCost`, `kcUsed`, `cashDue` | Number | the book's full cost, what KC actually covered, the cash gap |
| `status` | enum | completed / refunded |
| `sponsoredBy` | ObjectId → User | set only when a CSR sponsor covered the full cost — kcUsed/cashDue are both 0 in that case |
| `receiptNumber` | String | unique, human-facing |

### Sponsorship
A CSR sponsor's grant to a student — either a general KC top-up or a specific Sponsored Book.

| Field | Type |
|---|---|
| `sponsorId`, `studentId` | ObjectId → User |
| `bookId` | ObjectId → Book, **null = cash grant, set = sponsored book** |
| `kcAmount`, `note` | Number, String |

### Scholarship
The same shape and mechanics as Sponsorship, kept as a separate collection because the eligibility rule is genuinely different — a college admin can only fund their own college's students.

| Field | Type |
|---|---|
| `collegeAdminId`, `collegeId`, `studentId` | ObjectId |
| `kcAmount`, `note` | Number, String |

---

## RFID

### RfidTag
One tag per book, tracking physical custody independent of the digital borrow flow.

| Field | Type |
|---|---|
| `tagId` | String, unique — realistic EPC-style hex UID |
| `bookId` | ObjectId → Book, unique (1:1) |
| `vendorId` | ObjectId → User |
| `status` | checked_in / checked_out |
| `lastScannedAt`, `lastScannedBy` | Date, ObjectId |

---

## Notifications

### Notification
Generic on purpose — `type`/`message`/`link` can represent any event. Currently three real types: `waitlist_ready`, `due_soon`, `overdue`.

| Field | Type |
|---|---|
| `recipientId` | ObjectId → User |
| `type` | enum (see above) |
| `bookId` | ObjectId → Book, optional, used for due-reminder de-duplication |
| `message`, `link`, `read` | String, String, Boolean |

### ChatMessage
One document per message in the AI Chatbot conversation, both user and assistant sides — persists across sessions, not an ephemeral widget.

| Field | Type |
|---|---|
| `userId` | ObjectId → User |
| `role` | enum: user / assistant |
| `content` | String, max 2000 chars |

---

## Design notes that affect the schema

- **No soft-deletes anywhere.** Every `deleteMany` in the seed script is a genuine, deliberate wipe-and-regenerate for demo purposes — never used as a runtime pattern for real user actions, which always update status fields instead (a book becomes `recycled`/`sold`, never literally deleted).
- **Money fields are integers** (KC) or whole-rupee amounts (cash) throughout — no floating-point currency math anywhere.
- **Every collection that references `Book` gets wiped on reseed**, since `Book` documents are fully recreated (new IDs) on every `npm run seed` run, unlike `User`/`College` which are upserted with stable IDs.
