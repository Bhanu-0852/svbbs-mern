import mongoose from 'mongoose'
import User from '../models/User.js'
import Book from '../models/Book.js'
import BookHistory from '../models/BookHistory.js'
import Transaction from '../models/Transaction.js'
import Sponsorship from '../models/Sponsorship.js'
import KCWallet from '../models/KCWallet.js'
import { getOrCreateWallet } from './kcWalletService.js'
import { calculateDueDate } from '../utils/loanPolicy.js'
import { fail } from '../utils/response.js'
import { logAudit } from './auditService.js'

const MAX_GRANT = 5000 // sanity cap per single grant

export async function listStudents() {
  // Students a sponsor can fund, each with their current wallet balance
  // and how much this platform has sponsored them in total.
  const students = await User.find({ role: 'student' }).select('name email').sort({ name: 1 })
  const studentIds = students.map((s) => s._id)

  const [wallets, sponsoredAgg] = await Promise.all([
    KCWallet.find({ userId: { $in: studentIds } }).select('userId balance'),
    Sponsorship.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      { $group: { _id: '$studentId', total: { $sum: '$kcAmount' } } },
    ]),
  ])

  const balanceMap = Object.fromEntries(wallets.map((w) => [w.userId.toString(), w.balance]))
  const sponsoredMap = Object.fromEntries(sponsoredAgg.map((s) => [s._id.toString(), s.total]))

  return students.map((s) => ({
    id: s._id,
    name: s.name,
    email: s.email,
    walletBalance: balanceMap[s._id.toString()] || 0,
    totalSponsored: sponsoredMap[s._id.toString()] || 0,
  }))
}

/**
 * Books a sponsor could choose to fund — plainly available ones, same
 * eligibility as a normal borrow (excludes sell/exchange listings, which
 * aren't loans at all).
 */
export async function listSponsorableBooks() {
  return Book.find({ status: 'available', depositMethod: { $in: ['deposit', 'donate'] } })
    .select('title author coverImage kcValue condition')
    .sort({ createdAt: -1 })
    .limit(100)
}

export async function grantToStudent({ sponsorId, studentId, kcAmount, note }, req) {
  const amount = Number(kcAmount)
  if (!Number.isInteger(amount) || amount < 1) {
    throw fail(400, 'Grant amount must be a positive whole number of KC.')
  }
  if (amount > MAX_GRANT) {
    throw fail(400, `Single grants are capped at ${MAX_GRANT} KC.`)
  }

  const student = await User.findOne({ _id: studentId, role: 'student' })
  if (!student) throw fail(404, 'Student not found.')

  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      const wallet = await getOrCreateWallet(studentId, session)
      wallet.balance += amount
      await wallet.save({ session })

      const [sponsorship] = await Sponsorship.create(
        [{ sponsorId, studentId, kcAmount: amount, note: note || '' }],
        { session }
      )

      result = { sponsorship, newBalance: wallet.balance }
    })

    await logAudit({
      actorId: sponsorId,
      action: 'csr.grant',
      target: studentId.toString(),
      req,
      metadata: { kcAmount: amount },
    })

    return result
  } finally {
    await session.endSession()
  }
}

/**
 * Sponsored Book — genuinely distinct from a cash grant, not just a
 * relabeling of one. The sponsor picks a specific book for a specific
 * student, and the platform performs a real borrow on the student's
 * behalf: the book goes on loan to them, a real Transaction and
 * BookHistory entry are created via the same infrastructure every other
 * borrow uses — but kcUsed and cashDue are both 0, since the sponsor
 * covers the full value and the student's own wallet is never touched.
 * sponsoredBy on the Transaction is the honest record of who actually
 * paid. Same atomic eligibility guard as a normal borrow (re-used here,
 * not re-implemented loosely) so a sell/exchange listing or a book that
 * went unavailable a moment ago can't be "sponsored" out from under
 * someone.
 */
export async function sponsorBook({ sponsorId, studentId, bookId, note }, req) {
  const student = await User.findOne({ _id: studentId, role: 'student' })
  if (!student) throw fail(404, 'Student not found.')

  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      const book = await Book.findOneAndUpdate(
        { _id: bookId, status: 'available', depositMethod: { $in: ['deposit', 'donate'] } },
        { status: 'on_loan', currentHolderId: studentId, dueDate: calculateDueDate() },
        { new: true, session }
      )
      if (!book) {
        throw fail(409, 'This book is no longer available to sponsor.')
      }

      const kcCost = book.kcValue

      const [transaction] = await Transaction.create(
        [
          {
            userId: studentId,
            bookId: book._id,
            type: 'borrow',
            kcCost,
            kcUsed: 0,
            cashDue: 0,
            status: 'completed',
            sponsoredBy: sponsorId,
          },
        ],
        { session }
      )

      await BookHistory.create(
        [
          {
            bookId: book._id,
            event: 'borrowed',
            fromUserId: book.ownerId,
            toUserId: studentId,
            condition: book.condition,
            kcAmount: kcCost,
            note: `Sponsored — fully covered by a CSR sponsor, no cost to the student.`,
          },
        ],
        { session }
      )

      const [sponsorship] = await Sponsorship.create(
        [{ sponsorId, studentId, bookId: book._id, kcAmount: kcCost, note: note || '' }],
        { session }
      )

      result = { book, transaction, sponsorship }
    })

    await logAudit({
      actorId: sponsorId,
      action: 'csr.sponsor_book',
      target: bookId,
      req,
      metadata: { studentId: studentId.toString(), kcAmount: result.sponsorship.kcAmount },
    })

    return result
  } finally {
    await session.endSession()
  }
}

export async function getSponsorSummary(sponsorId) {
  const [grantAgg, recentGrants, categoryAgg] = await Promise.all([
    Sponsorship.aggregate([
      { $match: { sponsorId: new mongoose.Types.ObjectId(sponsorId) } },
      {
        $group: {
          _id: null,
          totalKcGranted: { $sum: '$kcAmount' },
          grantCount: { $sum: 1 },
          booksSponsored: { $sum: { $cond: [{ $ne: ['$bookId', null] }, 1, 0] } },
          students: { $addToSet: '$studentId' },
        },
      },
    ]),
    Sponsorship.find({ sponsorId })
      .populate('studentId', 'name email')
      .populate('bookId', 'title')
      .sort({ createdAt: -1 })
      .limit(20),
    // Category breakdown of sponsored BOOKS specifically (cash grants
    // have no book/category — a student spends those however they
    // choose) — real Impact Report substance, not just a flat activity
    // list. Same pattern as collegeService.getOverview's categoryBreakdown.
    Sponsorship.aggregate([
      { $match: { sponsorId: new mongoose.Types.ObjectId(sponsorId), bookId: { $ne: null } } },
      { $lookup: { from: 'books', localField: 'bookId', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' },
      { $unwind: '$book.categoryTags' },
      { $group: { _id: '$book.categoryTags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ])

  const agg = grantAgg[0] || { totalKcGranted: 0, grantCount: 0, booksSponsored: 0, students: [] }

  return {
    stats: {
      totalKcGranted: agg.totalKcGranted,
      grantCount: agg.grantCount,
      booksSponsored: agg.booksSponsored,
      studentsSupported: agg.students.length,
    },
    categoryBreakdown: categoryAgg.map((c) => ({ category: c._id, count: c.count })),
    recentGrants: recentGrants.map((g) => ({
      student: g.studentId ? { name: g.studentId.name, email: g.studentId.email } : null,
      book: g.bookId ? { title: g.bookId.title } : null,
      kcAmount: g.kcAmount,
      note: g.note,
      createdAt: g.createdAt,
    })),
  }
}
