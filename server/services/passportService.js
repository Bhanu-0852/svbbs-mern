import Transaction from '../models/Transaction.js'
import User from '../models/User.js'

export async function buildPassport(userId) {
  const user = await User.findById(userId).select('name email createdAt')

  const transactions = await Transaction.find({ userId, type: 'borrow' })
    .populate('bookId', 'title author coverImage categoryTags examTags')
    .sort({ createdAt: -1 })

  const books = transactions
    .filter((t) => t.bookId) // guard against a deleted book reference
    .map((t) => ({
      title: t.bookId.title,
      author: t.bookId.author,
      coverImage: t.bookId.coverImage,
      categoryTags: t.bookId.categoryTags,
      borrowedAt: t.createdAt,
      kcCost: t.kcCost,
    }))

  const categoriesExplored = [...new Set(books.flatMap((b) => b.categoryTags || []))]
  const totalKcSpent = transactions.reduce((sum, t) => sum + t.kcUsed, 0)
  const totalCashSpent = transactions.reduce((sum, t) => sum + t.cashDue, 0)

  return {
    user: { name: user.name, email: user.email, memberSince: user.createdAt },
    stats: {
      totalBooksBorrowed: books.length,
      totalKcSpent,
      totalCashSpent,
      categoriesExplored,
    },
    books,
  }
}
