import Book from '../models/Book.js'
import Transaction from '../models/Transaction.js'

export async function getInventory(vendorId) {
  return Book.find({ ownerId: vendorId })
    .populate('currentHolderId', 'name email')
    .sort({ updatedAt: -1 })
}

async function getOwnedBookIds(vendorId) {
  const books = await Book.find({ ownerId: vendorId }).select('_id')
  return books.map((b) => b._id)
}

export async function getTransactions(vendorId, limit = 50) {
  const bookIds = await getOwnedBookIds(vendorId)
  return Transaction.find({ bookId: { $in: bookIds } })
    .populate('bookId', 'title author coverImage')
    .populate('userId', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
}

export async function getStats(vendorId) {
  const bookIds = await getOwnedBookIds(vendorId)

  const [totalBooks, available, onLoan, revenue] = await Promise.all([
    Book.countDocuments({ ownerId: vendorId }),
    Book.countDocuments({ ownerId: vendorId, status: 'available' }),
    Book.countDocuments({ ownerId: vendorId, status: 'on_loan' }),
    Transaction.aggregate([
      { $match: { bookId: { $in: bookIds } } },
      { $group: { _id: null, totalKc: { $sum: '$kcUsed' }, totalCash: { $sum: '$cashDue' } } },
    ]),
  ])

  return {
    totalBooks,
    available,
    onLoan,
    totalKcEarned: revenue[0]?.totalKc || 0,
    totalCashEarned: revenue[0]?.totalCash || 0,
  }
}
