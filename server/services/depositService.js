import mongoose from 'mongoose'
import Book from '../models/Book.js'
import BookHistory from '../models/BookHistory.js'
import Transaction from '../models/Transaction.js'
import ExchangeProposal from '../models/ExchangeProposal.js'
import { calculateKcValue } from '../utils/kcRules.js'
import { coverUrl } from '../utils/bookCovers.js'
import { getOrCreateWallet } from './kcWalletService.js'
import { fail } from '../utils/response.js'
import { logAudit } from './auditService.js'

/**
 * Lists a book under one of four real, distinct deposit methods. This is
 * the foundational "add a book" flow that was entirely missing before —
 * previously the only way a book entered the system was the seed script.
 *
 *  - deposit: normal case. KC value is computed from condition + category
 *    bonuses (the same kcRules used everywhere else), and the depositor
 *    is credited that many KC immediately — the actual "earn Knowledge
 *    Credits" loop the spec describes, which had no real entry point
 *    until this slice.
 *  - donate: kcValue is forced to 0. No special-cased borrow logic is
 *    needed — the existing borrowBook flow already treats a 0-KC book as
 *    a free borrow for anyone, since kcUsed/cashDue both naturally
 *    compute to 0.
 *  - sell: cash-only, listed at salePrice. Not creditied at listing time
 *    — the cash transaction happens at purchase (see buyBook below).
 *  - exchange: listed for a direct swap proposal with another student's
 *    book. No money or KC moves at listing time either.
 */
export async function depositBook(userId, payload, req) {
  const { title, author, isbn, edition, description, condition, categoryTags, examTags, depositMethod, salePrice } =
    payload

  let kcValue = calculateKcValue(condition, categoryTags)
  if (depositMethod === 'donate') {
    kcValue = 0
  }

  const book = await Book.create({
    title,
    author,
    isbn,
    edition: edition || null,
    description: description || '',
    categoryTags,
    examTags: examTags || [],
    coverImage: coverUrl(isbn, 'L'),
    conditionPhotos: [coverUrl(isbn, 'L'), coverUrl(isbn, 'M')],
    condition,
    kcValue,
    status: 'available',
    ownerId: userId,
    depositMethod,
    salePrice: depositMethod === 'sell' ? salePrice : null,
  })

  let kcCredited = 0
  if (depositMethod === 'deposit') {
    const wallet = await getOrCreateWallet(userId)
    wallet.balance += kcValue
    await wallet.save()
    kcCredited = kcValue
  }

  const historyEvent = depositMethod === 'donate' ? 'donated' : 'deposited'
  const noteByMethod = {
    deposit: `Deposited for ${kcValue} KC.`,
    donate: `Donated — ${kcValue ? '' : 'no KC taken; '}available to borrow for free.`,
    sell: `Listed for sale at ₹${salePrice}.`,
    exchange: 'Listed for exchange — open to swap proposals.',
  }

  await BookHistory.create({
    bookId: book._id,
    event: historyEvent,
    fromUserId: userId,
    condition,
    kcAmount: depositMethod === 'deposit' ? kcValue : null,
    note: noteByMethod[depositMethod],
  })

  await logAudit({ actorId: userId, action: 'book.deposit', target: book._id, req, metadata: { depositMethod } })

  return { book, kcCredited }
}

export async function listMyListings(userId) {
  return Book.find({ ownerId: userId }).sort({ createdAt: -1 })
}

/**
 * Cash-only outright purchase of a 'sell'-listed book. Distinct from
 * borrowBook — no KC involved, ownership transfers permanently, and the
 * book leaves the lending pool entirely (status 'sold' is terminal, same
 * idea as 'recycled').
 */
export async function buyBook(bookId, buyerId, req) {
  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      const book = await Book.findOne({ _id: bookId }).session(session)
      if (!book) throw fail(404, 'Book not found.')
      if (String(book.ownerId) === String(buyerId)) {
        throw fail(400, "You can't buy your own listing.")
      }

      const sellerId = book.ownerId

      const updated = await Book.findOneAndUpdate(
        { _id: bookId, status: 'available', depositMethod: 'sell' },
        { status: 'sold', ownerId: buyerId },
        { new: true, session }
      )
      if (!updated) {
        throw fail(409, 'This book is no longer available for sale.')
      }

      const [transaction] = await Transaction.create(
        [
          {
            userId: buyerId,
            bookId: updated._id,
            type: 'sell',
            kcCost: 0,
            kcUsed: 0,
            cashDue: updated.salePrice,
            status: 'completed',
          },
        ],
        { session }
      )

      await BookHistory.create(
        [
          {
            bookId: updated._id,
            event: 'sold',
            fromUserId: sellerId,
            toUserId: buyerId,
            note: `Sold for ₹${updated.salePrice}.`,
          },
        ],
        { session }
      )

      result = { book: updated, transaction }
    })

    await logAudit({
      actorId: buyerId,
      action: 'book.buy',
      target: bookId,
      req,
      metadata: { cashDue: result.transaction.cashDue },
    })

    return result
  } finally {
    await session.endSession()
  }
}

export async function proposeExchange(targetBookId, offeredBookId, proposerId, req) {
  if (String(targetBookId) === String(offeredBookId)) {
    throw fail(400, "You can't offer the same book you're requesting.")
  }

  const targetBook = await Book.findOne({ _id: targetBookId, status: 'available', depositMethod: 'exchange' })
  if (!targetBook) {
    throw fail(404, 'This book is not currently listed for exchange.')
  }
  if (String(targetBook.ownerId) === String(proposerId)) {
    throw fail(400, "You can't propose a swap for your own book.")
  }

  const offeredBook = await Book.findOne({ _id: offeredBookId, ownerId: proposerId, status: 'available' })
  if (!offeredBook) {
    throw fail(404, "That book isn't yours to offer, or isn't currently available.")
  }

  const existing = await ExchangeProposal.findOne({
    targetBookId,
    offeredBookId,
    proposerId,
    status: 'pending',
  })
  if (existing) {
    throw fail(409, 'You already have a pending proposal for this swap.')
  }

  const proposal = await ExchangeProposal.create({
    targetBookId,
    offeredBookId,
    proposerId,
    targetOwnerId: targetBook.ownerId,
  })

  await logAudit({ actorId: proposerId, action: 'exchange.propose', target: targetBookId, req })

  return { proposal }
}

export async function getMyExchangeProposals(userId) {
  const populateOpts = [
    { path: 'targetBookId', select: 'title author coverImage' },
    { path: 'offeredBookId', select: 'title author coverImage' },
    { path: 'proposerId', select: 'name' },
    { path: 'targetOwnerId', select: 'name' },
  ]

  const [sent, received] = await Promise.all([
    ExchangeProposal.find({ proposerId: userId }).sort({ createdAt: -1 }).populate(populateOpts),
    ExchangeProposal.find({ targetOwnerId: userId }).sort({ createdAt: -1 }).populate(populateOpts),
  ])

  return { sent, received }
}

/**
 * Accept or decline a swap proposal. Accepting is atomic and re-checks
 * both books are still genuinely available right before swapping — a
 * book offered in a since-stale proposal might have been borrowed, sold,
 * recycled, or already swapped via a different proposal in the meantime.
 * Any other pending proposals touching either book are cancelled, since
 * those books are no longer the original owners' to trade.
 */
export async function respondToExchange(proposalId, userId, accept, req) {
  const proposal = await ExchangeProposal.findOne({ _id: proposalId, targetOwnerId: userId, status: 'pending' })
  if (!proposal) {
    throw fail(404, 'Proposal not found, or already resolved.')
  }

  if (!accept) {
    proposal.status = 'declined'
    await proposal.save()
    await logAudit({ actorId: userId, action: 'exchange.decline', target: proposal.targetBookId, req })
    return { proposal }
  }

  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const targetBook = await Book.findOne(
        { _id: proposal.targetBookId, status: 'available', depositMethod: 'exchange' },
        null,
        { session }
      )
      const offeredBook = await Book.findOne(
        { _id: proposal.offeredBookId, status: 'available' },
        null,
        { session }
      )
      if (!targetBook || !offeredBook) {
        throw fail(409, 'One of these books is no longer available to swap.')
      }

      const originalTargetOwner = targetBook.ownerId
      const originalOfferedOwner = offeredBook.ownerId

      targetBook.ownerId = originalOfferedOwner
      targetBook.depositMethod = 'deposit' // re-enters normal circulation under the new owner
      offeredBook.ownerId = originalTargetOwner
      offeredBook.depositMethod = 'deposit'

      await targetBook.save({ session })
      await offeredBook.save({ session })

      await BookHistory.create(
        [
          {
            bookId: targetBook._id,
            event: 'exchanged',
            fromUserId: originalTargetOwner,
            toUserId: originalOfferedOwner,
            note: `Exchanged for "${offeredBook.title}".`,
          },
          {
            bookId: offeredBook._id,
            event: 'exchanged',
            fromUserId: originalOfferedOwner,
            toUserId: originalTargetOwner,
            note: `Exchanged for "${targetBook.title}".`,
          },
        ],
        { session }
      )

      proposal.status = 'accepted'
      await proposal.save({ session })

      // Any other pending proposal touching either book no longer makes
      // sense — the books just changed hands.
      await ExchangeProposal.updateMany(
        {
          _id: { $ne: proposal._id },
          status: 'pending',
          $or: [
            { targetBookId: targetBook._id },
            { offeredBookId: targetBook._id },
            { targetBookId: offeredBook._id },
            { offeredBookId: offeredBook._id },
          ],
        },
        { status: 'cancelled' },
        { session }
      )
    })

    await logAudit({ actorId: userId, action: 'exchange.accept', target: proposal.targetBookId, req })

    return { proposal }
  } finally {
    await session.endSession()
  }
}
