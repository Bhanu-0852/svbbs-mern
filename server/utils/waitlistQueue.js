/**
 * Pure waitlist-queue helpers, extracted from waitlistService.js so the
 * FIFO ordering rule can be unit-tested without a live database. The
 * service's Mongo query (find waiting, sort createdAt asc, take first)
 * mirrors pickNextWaiting exactly — this is the same rule expressed over
 * an in-memory array for testability.
 */

/**
 * Given all waitlist entries for a book, return the one that should be
 * promoted next: the oldest entry still in 'waiting' status. Returns null
 * if nobody is waiting (cancelled/claimed/ready entries are ignored).
 */
export function pickNextWaiting(entries) {
  const waiting = entries.filter((e) => e.status === 'waiting')
  if (waiting.length === 0) return null
  return [...waiting].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))[0]
}

/**
 * Whether a given user is allowed to borrow a book right now: only if it's
 * plainly available, or reserved specifically for them. Mirrors the $or
 * filter in borrowService.borrowBook.
 */
export function canUserBorrow(book, userId) {
  if (book.status === 'available') return true
  if (book.status === 'reserved' && String(book.reservedForUserId) === String(userId)) return true
  return false
}
