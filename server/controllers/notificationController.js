import * as notificationService from '../services/notificationService.js'
import { ok } from '../utils/response.js'

export async function list(req, res, next) {
  try {
    const [notifications, unreadCount] = await Promise.all([
      notificationService.listForUser(req.user._id),
      notificationService.getUnreadCount(req.user._id),
    ])
    ok(res, { notifications, unreadCount })
  } catch (err) {
    next(err)
  }
}

export async function markRead(req, res, next) {
  try {
    const notification = await notificationService.markRead(req.params.id, req.user._id)
    ok(res, { notification })
  } catch (err) {
    next(err)
  }
}

export async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllRead(req.user._id)
    ok(res, {}, 'All notifications marked read.')
  } catch (err) {
    next(err)
  }
}
