import mongoose from 'mongoose'
import User from '../models/User.js'
import College from '../models/College.js'
import Transaction from '../models/Transaction.js'
import Scholarship from '../models/Scholarship.js'
import WaitlistEntry from '../models/WaitlistEntry.js'
import { getOrCreateWallet } from './kcWalletService.js'
import { fail } from '../utils/response.js'
import { logAudit } from './auditService.js'

const MAX_SCHOLARSHIP = 5000 // same sanity cap as a CSR grant

/**
 * Everything here is scoped to ONE college — the one the logged-in admin
 * belongs to (req.user.collegeId). A college's footprint is defined by
 * its students and what they borrow; books belong to vendors, not
 * colleges, so nothing here claims institutional book ownership.
 */
async function getCollegeStudentIds(collegeId) {
  const students = await User.find({ collegeId, role: 'student' }).select('_id')
  return students.map((s) => s._id)
}

export async function getOverview(collegeId) {
  if (!collegeId) {
    throw fail(400, 'This admin account is not linked to a college.')
  }

  const college = await College.findById(collegeId)
  if (!college) throw fail(404, 'College not found.')

  const studentIds = await getCollegeStudentIds(collegeId)

  const [totalStudents, activityAgg, categoryAgg] = await Promise.all([
    User.countDocuments({ collegeId, role: 'student' }),
    Transaction.aggregate([
      { $match: { userId: { $in: studentIds }, type: 'borrow' } },
      {
        $group: {
          _id: null,
          totalBorrows: { $sum: 1 },
          totalKcSpent: { $sum: '$kcUsed' },
          totalCashSpent: { $sum: '$cashDue' },
        },
      },
    ]),
    // Category breakdown of what this college's students have borrowed
    Transaction.aggregate([
      { $match: { userId: { $in: studentIds }, type: 'borrow' } },
      { $lookup: { from: 'books', localField: 'bookId', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' },
      { $unwind: '$book.categoryTags' },
      { $group: { _id: '$book.categoryTags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ])

  const activity = activityAgg[0] || { totalBorrows: 0, totalKcSpent: 0, totalCashSpent: 0 }

  // Sustainability framing the college could use for reporting: each borrow
  // is a book reused instead of newly bought. Money saved = KC used (each
  // KC unit = ₹1 of cash a student didn't spend), consistent with the
  // platform-wide Sustainability module's methodology.
  const sustainability = {
    booksReused: activity.totalBorrows,
    moneySavedByStudents: activity.totalKcSpent,
  }

  return {
    college: { name: college.name, city: college.city, code: college.code },
    stats: {
      totalStudents,
      totalBorrows: activity.totalBorrows,
      totalKcSpent: activity.totalKcSpent,
      totalCashSpent: activity.totalCashSpent,
    },
    sustainability,
    categoryBreakdown: categoryAgg.map((c) => ({ category: c._id, count: c.count })),
  }
}

export async function getStudents(collegeId) {
  if (!collegeId) throw fail(400, 'This admin account is not linked to a college.')

  const students = await User.find({ collegeId, role: 'student' })
    .select('name email collegeVerified createdAt')
    .sort({ createdAt: -1 })

  // Attach each student's borrow count from real transactions
  const studentIds = students.map((s) => s._id)
  const borrowCounts = await Transaction.aggregate([
    { $match: { userId: { $in: studentIds }, type: 'borrow' } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ])
  const countMap = Object.fromEntries(borrowCounts.map((b) => [b._id.toString(), b.count]))

  return students.map((s) => ({
    id: s._id,
    name: s.name,
    email: s.email,
    collegeVerified: s.collegeVerified,
    borrowCount: countMap[s._id.toString()] || 0,
  }))
}

/**
 * Awards a real KC scholarship — same mechanics as a CSR grant (tops up
 * the student's actual KCWallet atomically), but restricted to students
 * who actually belong to this admin's own college. That eligibility
 * check is the entire reason this isn't just "CSR grants, but for
 * colleges" — a college admin granting to a student outside their
 * institution wouldn't make sense and shouldn't be possible.
 */
export async function awardScholarship({ collegeAdminId, collegeId, studentId, kcAmount, note }, req) {
  if (!collegeId) throw fail(400, 'This admin account is not linked to a college.')

  const amount = Number(kcAmount)
  if (!Number.isInteger(amount) || amount < 1) {
    throw fail(400, 'Scholarship amount must be a positive whole number of KC.')
  }
  if (amount > MAX_SCHOLARSHIP) {
    throw fail(400, `Single scholarships are capped at ${MAX_SCHOLARSHIP} KC.`)
  }

  const student = await User.findOne({ _id: studentId, role: 'student', collegeId })
  if (!student) {
    throw fail(404, 'Student not found at your college.')
  }

  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      const wallet = await getOrCreateWallet(studentId, session)
      wallet.balance += amount
      await wallet.save({ session })

      const [scholarship] = await Scholarship.create(
        [{ collegeAdminId, collegeId, studentId, kcAmount: amount, note: note || '' }],
        { session }
      )

      result = { scholarship, newBalance: wallet.balance }
    })

    await logAudit({
      actorId: collegeAdminId,
      action: 'college.scholarship',
      target: studentId.toString(),
      req,
      metadata: { kcAmount: amount },
    })

    return result
  } finally {
    await session.endSession()
  }
}

export async function getScholarshipHistory(collegeId) {
  if (!collegeId) throw fail(400, 'This admin account is not linked to a college.')

  const [summaryAgg, recent] = await Promise.all([
    Scholarship.aggregate([
      { $match: { collegeId: new mongoose.Types.ObjectId(collegeId) } },
      {
        $group: {
          _id: null,
          totalKcAwarded: { $sum: '$kcAmount' },
          awardCount: { $sum: 1 },
          students: { $addToSet: '$studentId' },
        },
      },
    ]),
    Scholarship.find({ collegeId }).populate('studentId', 'name email').sort({ createdAt: -1 }).limit(20),
  ])

  const summary = summaryAgg[0] || { totalKcAwarded: 0, awardCount: 0, students: [] }

  return {
    stats: {
      totalKcAwarded: summary.totalKcAwarded,
      awardCount: summary.awardCount,
      studentsSupported: summary.students.length,
    },
    recent: recent.map((s) => ({
      student: s.studentId ? { name: s.studentId.name, email: s.studentId.email } : null,
      kcAmount: s.kcAmount,
      note: s.note,
      createdAt: s.createdAt,
    })),
  }
}

/**
 * Real signal, not a trained model — matches the same honesty framing
 * already used for recommendationService.js ("simple ranking, not AI").
 * Two genuinely actionable views into this college's own students:
 *   - which categories they borrow most (what to keep stocking)
 *   - which specific books they're actively waitlisted on right now (a
 *     concrete "you need more copies of X" signal, not a guess)
 */
export async function getDemandForecast(collegeId) {
  if (!collegeId) throw fail(400, 'This admin account is not linked to a college.')

  const studentIds = await getCollegeStudentIds(collegeId)

  const [categoryDemand, waitlistPressure] = await Promise.all([
    Transaction.aggregate([
      { $match: { userId: { $in: studentIds }, type: 'borrow' } },
      { $lookup: { from: 'books', localField: 'bookId', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' },
      { $unwind: '$book.categoryTags' },
      { $group: { _id: '$book.categoryTags', borrowCount: { $sum: 1 } } },
      { $sort: { borrowCount: -1 } },
      { $limit: 5 },
    ]),
    WaitlistEntry.aggregate([
      { $match: { userId: { $in: studentIds }, status: 'waiting' } },
      { $group: { _id: '$bookId', waitingCount: { $sum: 1 } } },
      { $sort: { waitingCount: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' },
      { $project: { _id: 0, title: '$book.title', author: '$book.author', waitingCount: 1 } },
    ]),
  ])

  return {
    trendingCategories: categoryDemand.map((c) => ({ category: c._id, borrowCount: c.borrowCount })),
    waitlistPressure,
  }
}
