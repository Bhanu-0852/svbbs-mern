import User from '../models/User.js'
import Book from '../models/Book.js'
import Transaction from '../models/Transaction.js'
import KCWallet from '../models/KCWallet.js'
import AuditLog from '../models/AuditLog.js'

export async function getStats() {
  const [
    totalUsers,
    usersByRoleAgg,
    totalBooks,
    booksByStatusAgg,
    totalTransactions,
    walletAgg,
    transactionAgg,
    lockedAccounts,
  ] = await Promise.all([
    User.countDocuments(),
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Book.countDocuments(),
    Book.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Transaction.countDocuments(),
    KCWallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]),
    Transaction.aggregate([
      { $group: { _id: null, totalKcUsed: { $sum: '$kcUsed' }, totalCash: { $sum: '$cashDue' } } },
    ]),
    User.countDocuments({ lockedUntil: { $gt: new Date() } }),
  ])

  return {
    totalUsers,
    usersByRole: Object.fromEntries(usersByRoleAgg.map((r) => [r._id, r.count])),
    totalBooks,
    booksByStatus: Object.fromEntries(booksByStatusAgg.map((r) => [r._id, r.count])),
    totalTransactions,
    kcInCirculation: walletAgg[0]?.total || 0,
    totalKcSpentAllTime: transactionAgg[0]?.totalKcUsed || 0,
    totalCashCollected: transactionAgg[0]?.totalCash || 0,
    lockedAccounts, // a real security signal — accounts currently locked from repeated failed logins
  }
}

export async function getRecentAuditLogs(limit = 20) {
  return AuditLog.find().populate('actorId', 'name email role').sort({ createdAt: -1 }).limit(limit)
}
