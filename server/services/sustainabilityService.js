import mongoose from 'mongoose'
import Book from '../models/Book.js'
import Transaction from '../models/Transaction.js'

// Methodology, stated plainly rather than presented as precise science:
// these are simplified estimation factors commonly used by sustainability
// dashboards, not authoritative lifecycle-assessment figures.
const BOOKS_PER_TREE = 20 // rough estimate: reusing/recycling 20 books ≈ saving 1 tree's worth of paper
const CO2_KG_PER_BOOK = 2.5 // rough estimate: avoided emissions per book not newly printed

const CATEGORY_LABELS = {
  engineering: 'Engineering',
  medical: 'Medical',
  government_exam: 'Government Exam',
  rare: 'Rare',
  arts: 'Arts',
  science: 'Science',
  general: 'General',
}

export async function getImpactStats() {
  const [booksReused, booksRecycled, moneySavedAgg] = await Promise.all([
    Transaction.countDocuments({ type: 'borrow' }),
    Book.countDocuments({ status: 'recycled' }),
    Transaction.aggregate([
      { $match: { type: 'borrow' } },
      { $group: { _id: null, totalKcUsed: { $sum: '$kcUsed' } } },
    ]),
  ])

  // Each KC unit used in place of cash represents ₹1 of cash the student
  // didn't have to spend, per the hybrid payment design (kcCost = kcUsed + cashDue).
  const moneySaved = moneySavedAgg[0]?.totalKcUsed || 0

  const totalCirculated = booksReused + booksRecycled

  return {
    booksReused,
    booksRecycled,
    treesSaved: Math.round(totalCirculated / BOOKS_PER_TREE),
    co2ReducedKg: Math.round(totalCirculated * CO2_KG_PER_BOOK),
    moneySaved,
  }
}

export async function getCategoryBreakdown() {
  const transactions = await Transaction.find({ type: 'borrow' }).populate('bookId', 'categoryTags')

  const counts = {}
  transactions.forEach((t) => {
    const tags = t.bookId?.categoryTags || []
    tags.forEach((tag) => {
      counts[tag] = (counts[tag] || 0) + 1
    })
  })

  return Object.entries(counts).map(([tag, count]) => ({
    category: CATEGORY_LABELS[tag] || tag,
    count,
  }))
}

/**
 * One student's own sustainability impact — the Student Dashboard
 * sub-feature the spec lists, distinct from the platform-wide /
 * sustainability page (which is everyone's combined activity). Reuses
 * the exact same BOOKS_PER_TREE / CO2_KG_PER_BOOK estimation factors so
 * the methodology stays consistent and isn't silently reinvented per
 * scope. Recycling isn't included here — that's a vendor/recycler-side
 * action, not something an individual student does, so only their own
 * borrows are counted as genuinely personal impact.
 */
export async function getPersonalImpact(userId) {
  const [booksReused, moneySavedAgg] = await Promise.all([
    Transaction.countDocuments({ userId, type: 'borrow' }),
    Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), type: 'borrow' } },
      { $group: { _id: null, totalKcUsed: { $sum: '$kcUsed' } } },
    ]),
  ])

  const moneySaved = moneySavedAgg[0]?.totalKcUsed || 0

  return {
    booksReused,
    treesSaved: Math.round(booksReused / BOOKS_PER_TREE),
    co2ReducedKg: Math.round(booksReused * CO2_KG_PER_BOOK),
    moneySaved,
  }
}
