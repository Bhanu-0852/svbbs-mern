import mongoose from 'mongoose'
import Book from '../models/Book.js'
import WaitlistEntry from '../models/WaitlistEntry.js'
import { createNotification } from './notificationService.js'
import { fail } from '../utils/response.js'

export async function joinWaitlist(userId, bookId) {
  const book = await Book.findById(bookId)
  if (!book) throw fail(404, 'Book not found.')
  if (book.status !== 'on_loan') {
    throw fail(400, 'You can only join a waitlist for a book that is currently on loan.')
  }
  if (book.currentHolderId?.toString() === userId.toString()) {
    throw fail(400, 'You already hold this book.')
  }

  const existing = await WaitlistEntry.findOne({ bookId, userId, status: { $in: ['waiting', 'ready'] } })
  if (existing) {
    throw fail(409, 'You are already on the waitlist for this book.')
  }

  return WaitlistEntry.create({ bookId, userId, status: 'waiting' })
}

export async function leaveWaitlist(userId, bookId) {
  // Cancelling a 'ready' entry (a held reservation) must also clear the
  // book's reservedForUserId and promote whoever's next — otherwise the
  // book would stay reserved for someone who just gave it up.
  const entry = await WaitlistEntry.findOneAndUpdate(
    { bookId, userId, status: { $in: ['waiting', 'ready'] } },
    { status: 'cancelled' },
    { new: true }
  )
  if (!entry) throw fail(404, 'You are not on the waitlist for this book.')

  const book = await Book.findOne({ _id: bookId, reservedForUserId: userId })
  if (book) {
    book.status = 'available'
    book.reservedForUserId = null
    await book.save()
    await promoteNextInWaitlist(bookId)
  }

  return entry
}

export async function getWaitlistStatusForUser(userId, bookId) {
  const entry = await WaitlistEntry.findOne({ bookId, userId, status: { $in: ['waiting', 'ready'] } })
  return entry ? entry.status : null
}

export async function getQueueLength(bookId) {
  return WaitlistEntry.countDocuments({ bookId, status: 'waiting' })
}

/**
 * Called right after a successful return. If anyone is waiting, the book
 * goes to 'reserved' and is held exclusively for whoever has been
 * waiting longest, who gets notified. If nobody is waiting, the caller
 * is responsible for leaving the book as 'available' — this function
 * only acts when there's actually a queue.
 */
export async function promoteNextInWaitlist(bookId) {
  const session = await mongoose.startSession()
  try {
    let promoted = null
    await session.withTransaction(async () => {
      const nextEntry = await WaitlistEntry.findOne({ bookId, status: 'waiting' })
        .sort({ createdAt: 1 })
        .session(session)

      if (!nextEntry) return // nobody waiting — book stays available

      const book = await Book.findOneAndUpdate(
        { _id: bookId, status: 'available' },
        { status: 'reserved', reservedForUserId: nextEntry.userId },
        { new: true, session }
      )
      if (!book) return // book wasn't actually available to reserve (shouldn't normally happen)

      nextEntry.status = 'ready'
      await nextEntry.save({ session })

      promoted = { book, entry: nextEntry }
    })

    if (promoted) {
      await createNotification({
        recipientId: promoted.entry.userId,
        type: 'waitlist_ready',
        message: `"${promoted.book.title}" is ready for you to borrow — you were next on the waitlist.`,
        link: `/marketplace/${promoted.book._id}`,
      })
    }

    return promoted
  } finally {
    await session.endSession()
  }
}
