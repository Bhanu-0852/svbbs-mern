import Book from '../models/Book.js'
import Transaction from '../models/Transaction.js'
import { topCategoriesByFrequency, rankByCategoryOverlap } from '../utils/recommendationRanking.js'

const RECOMMENDATION_LIMIT = 6

/**
 * A transparent, rule-based heuristic — not a trained model — so it's
 * framed honestly as "Recommended for you, based on categories you've
 * borrowed in" rather than oversold as "AI-powered." It ranks a user's
 * most-borrowed categories, then surfaces available books sharing those
 * tags that the user hasn't already borrowed.
 *
 * Cold start: a brand-new user with no borrow history gets a sensible
 * fallback (most recently added available books) instead of an empty
 * section or a fake personalization claim.
 */
export async function getRecommendations(userId) {
  const transactions = await Transaction.find({ userId, type: 'borrow' }).populate(
    'bookId',
    'categoryTags'
  )

  const borrowedBookIds = new Set(transactions.filter((t) => t.bookId).map((t) => t.bookId._id.toString()))

  const categoryCounts = {}
  transactions.forEach((t) => {
    ;(t.bookId?.categoryTags || []).forEach((tag) => {
      categoryCounts[tag] = (categoryCounts[tag] || 0) + 1
    })
  })

  const topCategories = topCategoriesByFrequency(categoryCounts, 3)

  if (topCategories.length === 0) {
    const books = await Book.find({ status: 'available' }).sort({ createdAt: -1 }).limit(RECOMMENDATION_LIMIT)
    return {
      basis: 'cold_start',
      recommendations: books.map((book) => ({ book, matchedCategories: [] })),
    }
  }

  const candidates = await Book.find({
    status: 'available',
    categoryTags: { $in: topCategories },
    _id: { $nin: [...borrowedBookIds] },
  })
    .sort({ createdAt: -1 })
    .limit(RECOMMENDATION_LIMIT * 3) // overfetch, then rank by overlap below

  const ranked = rankByCategoryOverlap(candidates, topCategories).slice(0, RECOMMENDATION_LIMIT)

  return { basis: 'borrow_history', recommendations: ranked }
}
