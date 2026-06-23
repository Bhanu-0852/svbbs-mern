import Book from '../models/Book.js'
import BookHistory from '../models/BookHistory.js'
import { fail } from '../utils/response.js'
import { logAudit } from './auditService.js'

// Books eligible for recycling: poor condition and not currently out on
// loan or already recycled. This mirrors the original spec's idea that
// end-of-life books leave circulation through the recycler rather than
// being resold.
const CANDIDATE_FILTER = { condition: 'poor', status: 'available' }

// A flat, honestly-simplified scrap value per recycled book — a real
// recycler would price by weight/material, which this app has no way to
// know. Every recycling candidate is already filtered to poor condition
// (see CANDIDATE_FILTER above), so there's no real variance to model;
// a flat rate keeps this an honest estimate rather than fake precision.
const SCRAP_VALUE_PER_BOOK = 8

export async function getCandidates() {
  return Book.find(CANDIDATE_FILTER).sort({ updatedAt: -1 })
}

export async function getRecycledBooks() {
  return Book.find({ status: 'recycled' }).sort({ updatedAt: -1 })
}

export async function getStats() {
  const [pendingCandidates, totalRecycled] = await Promise.all([
    Book.countDocuments(CANDIDATE_FILTER),
    Book.countDocuments({ status: 'recycled' }),
  ])
  return { pendingCandidates, totalRecycled }
}

/**
 * Revenue Tracking — the spec-listed Recycler Dashboard sub-feature that
 * was missing entirely. Real, queryable totals from the actual
 * cashAmount recorded on every 'recycled' BookHistory event, not a
 * display-only number.
 */
export async function getRevenue(recyclerId) {
  const recycledEvents = await BookHistory.find({ event: 'recycled', fromUserId: recyclerId })
    .populate('bookId', 'title author')
    .sort({ createdAt: -1 })

  const totalRevenue = recycledEvents.reduce((sum, e) => sum + (e.cashAmount || 0), 0)

  return {
    totalRevenue,
    scrapValuePerBook: SCRAP_VALUE_PER_BOOK,
    recent: recycledEvents.slice(0, 20).map((e) => ({
      bookTitle: e.bookId?.title || 'Unknown book',
      cashAmount: e.cashAmount,
      createdAt: e.createdAt,
    })),
  }
}

export async function recycleBook(bookId, recyclerId, req) {
  // Atomic guard: only recycle a book that's genuinely a candidate right
  // now (poor + available), so two recyclers can't double-process one,
  // and a book that just got borrowed can't be recycled out from under
  // the borrower.
  const book = await Book.findOneAndUpdate(
    { _id: bookId, ...CANDIDATE_FILTER },
    { status: 'recycled' },
    { new: true }
  )

  if (!book) {
    throw fail(409, 'This book is no longer eligible for recycling.')
  }

  await BookHistory.create({
    bookId: book._id,
    event: 'recycled',
    fromUserId: recyclerId,
    condition: book.condition,
    cashAmount: SCRAP_VALUE_PER_BOOK,
    note: `Processed for recycling by the recycling partner — removed from circulation. Scrap value: ₹${SCRAP_VALUE_PER_BOOK}.`,
  })

  await logAudit({ actorId: recyclerId, action: 'recycler.recycle', target: bookId, req })

  return { book }
}
