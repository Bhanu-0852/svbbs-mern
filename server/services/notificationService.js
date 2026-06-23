import Notification from '../models/Notification.js'
import Book from '../models/Book.js'
import { classifyDueStatus } from '../utils/loanPolicy.js'

export async function createNotification({ recipientId, type, message, link, bookId }, session = null) {
  const [notification] = await Notification.create(
    [{ recipientId, type, message, link: link || '', bookId: bookId || null }],
    { session }
  )
  return notification
}

export async function listForUser(userId, limit = 20) {
  // If this user has never had any notifications at all, create a
  // welcome one so the bell isn't empty on first login — gives new
  // users immediate feedback that the notification system is working.
  const count = await Notification.countDocuments({ recipientId: userId })
  if (count === 0) {
    await createNotification({
      recipientId: userId,
      type: 'welcome',
      message: 'Welcome to SVBBS! Deposit a book to earn your first Knowledge Credits.',
      link: '/student/deposit',
    })
  }
  return Notification.find({ recipientId: userId }).sort({ createdAt: -1 }).limit(limit)
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments({ recipientId: userId, read: false })
}

export async function markRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { read: true },
    { new: true }
  )
}

export async function markAllRead(userId) {
  await Notification.updateMany({ recipientId: userId, read: false }, { read: true })
}

const REMINDER_COOLDOWN_HOURS = 20

export async function checkDueReminders(userId) {
  const heldBooks = await Book.find({
    currentHolderId: userId,
    status: 'on_loan',
    dueDate: { $ne: null },
  })

  for (const book of heldBooks) {
    const status = classifyDueStatus(book.dueDate)
    if (status === 'ok') continue

    const cooldownSince = new Date(Date.now() - REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000)
    // eslint-disable-next-line no-await-in-loop
    const recent = await Notification.findOne({
      recipientId: userId,
      bookId: book._id,
      type: status,
      createdAt: { $gte: cooldownSince },
    })
    if (recent) continue

    const message =
      status === 'overdue'
        ? `"${book.title}" is overdue — please return it when you can.`
        : `"${book.title}" is due back soon.`

    // eslint-disable-next-line no-await-in-loop
    await createNotification({
      recipientId: userId,
      type: status,
      message,
      link: `/marketplace/${book._id}`,
      bookId: book._id,
    })
  }
}