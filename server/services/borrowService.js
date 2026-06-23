import mongoose from 'mongoose'
import Book from '../models/Book.js'
import BookHistory from '../models/BookHistory.js'
import Transaction from '../models/Transaction.js'
import WaitlistEntry from '../models/WaitlistEntry.js'
import { getOrCreateWallet } from './kcWalletService.js'
import { promoteNextInWaitlist } from './waitlistService.js'
import { calculateDueDate, LOAN_PERIOD_DAYS } from '../utils/loanPolicy.js'
import { fail } from '../utils/response.js'
import { logAudit } from './auditService.js'

export async function borrowBook(userId, bookId, req) {
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      // Atomic guard: succeeds if the book is plain 'available', OR if
      // it's 'reserved' specifically for this user (they were next on
      // the waitlist and are now claiming it). Anyone else hitting this
      // while it's reserved for someone else simply won't match either
      // branch and gets the same 409 as a normal race-lost borrow.
      // Also excludes 'sell'/'exchange' listings — those aren't loans,
      // they're an outright purchase or a swap, handled by
      // depositService.js instead. This is enforced here, not just hidden
      // in the UI, since the UI is only a convenience — the real boundary
      // is server-side, same as everywhere else in this app.
      const book = await Book.findOneAndUpdate(
        {
          _id: bookId,
          depositMethod: { $in: ['deposit', 'donate'] },
          $or: [{ status: 'available' }, { status: 'reserved', reservedForUserId: userId }],
        },
        { status: 'on_loan', currentHolderId: userId, reservedForUserId: null, dueDate: calculateDueDate() },
        { new: true, session }
      )
      if (!book) {
        throw fail(409, 'This book is no longer available.')
      }

      // If this was a waitlist claim, close out that entry so the queue
      // logic doesn't think they're still waiting.
      await WaitlistEntry.updateOne(
        { bookId: book._id, userId, status: 'ready' },
        { status: 'claimed' },
        { session }
      )

      const wallet = await getOrCreateWallet(userId, session)

      const kcCost = book.kcValue
      const kcUsed = Math.min(kcCost, wallet.balance)
      const cashDue = kcCost - kcUsed // MOCK_PAYMENTS handles this instantly; Razorpay-ready seam

      wallet.balance -= kcUsed
      await wallet.save({ session })

      const [transaction] = await Transaction.create(
        [{ userId, bookId: book._id, type: 'borrow', kcCost, kcUsed, cashDue, status: 'completed' }],
        { session }
      )

      await BookHistory.create(
        [
          {
            bookId: book._id,
            event: 'borrowed',
            fromUserId: book.ownerId,
            toUserId: userId,
            condition: book.condition,
            kcAmount: kcCost,
            note:
              (cashDue > 0 ? `Paid ${kcUsed} KC + ₹${cashDue} cash.` : `Paid ${kcUsed} KC.`) +
              ` Due back within ${LOAN_PERIOD_DAYS} days.`,
          },
        ],
        { session }
      )

      result = { book, transaction, walletBalance: wallet.balance }
    })

    await logAudit({
      actorId: userId,
      action: 'wallet.borrow',
      target: bookId,
      req,
      metadata: { kcUsed: result.transaction.kcUsed, cashDue: result.transaction.cashDue },
    })

    return result
  } finally {
    await session.endSession()
  }
}

export async function returnBook(userId, bookId, req) {
  // Atomic guard: only the current holder can return it, and only while
  // it's actually on loan — prevents double-return races too.
  const book = await Book.findOneAndUpdate(
    { _id: bookId, currentHolderId: userId, status: 'on_loan' },
    { status: 'available', currentHolderId: null, dueDate: null },
    { new: true }
  )

  if (!book) {
    throw fail(403, 'You are not currently holding this book.')
  }

  await BookHistory.create({
    bookId: book._id,
    event: 'returned',
    fromUserId: userId,
    toUserId: book.ownerId,
    condition: book.condition,
    note: 'Returned to inventory. No KC refund — see the README for the borrow/return model.',
  })

  await logAudit({ actorId: userId, action: 'wallet.return', target: bookId, req })

  // If anyone's waiting for this exact book, this flips it to 'reserved'
  // for them and notifies them — otherwise it's a no-op and the book
  // stays 'available' as already set above.
  const promotion = await promoteNextInWaitlist(bookId)

  return { book: promotion ? promotion.book : book }
}
