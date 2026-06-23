import User from '../models/User.js'
import Transaction from '../models/Transaction.js'
import { getOrCreateWallet } from './kcWalletService.js'
import { fail } from '../utils/response.js'
import { logAudit } from './auditService.js'

const MAX_TOPUP = 5000

/**
 * Deliberately narrower than the CSR sponsor flow: a CSR sponsor can fund
 * ANY student (a scholarship body funding the platform broadly), but a
 * parent can only ever top up their OWN linked child (User.parentId).
 * That ownership boundary is enforced at the route layer via
 * requireOwnership, and re-checked here as defense in depth in case this
 * service is ever called from somewhere else.
 */
export async function getLinkedChildren(parentId) {
  const children = await User.find({ parentId, role: 'student' }).select('name email')
  const childIds = children.map((c) => c._id)

  const [wallets, borrowAgg] = await Promise.all([
    Promise.all(childIds.map((id) => getOrCreateWallet(id))),
    Transaction.aggregate([
      { $match: { userId: { $in: childIds }, type: 'borrow' } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]),
  ])

  const balanceMap = Object.fromEntries(wallets.map((w) => [w.userId.toString(), w.balance]))
  const borrowMap = Object.fromEntries(borrowAgg.map((b) => [b._id.toString(), b.count]))

  return children.map((c) => ({
    id: c._id,
    name: c.name,
    email: c.email,
    walletBalance: balanceMap[c._id.toString()] || 0,
    borrowCount: borrowMap[c._id.toString()] || 0,
  }))
}

async function assertIsOwnChild(parentId, studentId) {
  const student = await User.findOne({ _id: studentId, role: 'student' }).select('parentId')
  if (!student) throw fail(404, 'Student not found.')
  if (!student.parentId || student.parentId.toString() !== parentId.toString()) {
    throw fail(403, 'You can only manage your own linked child’s wallet.')
  }
}

export async function topUpChild({ parentId, studentId, kcAmount }, req) {
  const amount = Number(kcAmount)
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_TOPUP) {
    throw fail(400, `Top-up amount must be a whole number between 1 and ${MAX_TOPUP} KC.`)
  }

  await assertIsOwnChild(parentId, studentId)

  const wallet = await getOrCreateWallet(studentId)
  wallet.balance += amount
  await wallet.save()

  await logAudit({
    actorId: parentId,
    action: 'parent.topup',
    target: studentId.toString(),
    req,
    metadata: { kcAmount: amount },
  })

  return { newBalance: wallet.balance }
}

export async function getChildActivity(parentId, studentId) {
  await assertIsOwnChild(parentId, studentId)

  const transactions = await Transaction.find({ userId: studentId })
    .populate('bookId', 'title author coverImage')
    .sort({ createdAt: -1 })
    .limit(20)

  return transactions.map((t) => ({
    type: t.type,
    book: t.bookId ? { title: t.bookId.title, author: t.bookId.author, coverImage: t.bookId.coverImage } : null,
    kcUsed: t.kcUsed,
    cashDue: t.cashDue,
    createdAt: t.createdAt,
  }))
}
