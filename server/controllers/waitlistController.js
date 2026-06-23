import * as waitlistService from '../services/waitlistService.js'
import { ok } from '../utils/response.js'

export async function join(req, res, next) {
  try {
    await waitlistService.joinWaitlist(req.user._id, req.params.id)
    ok(res, {}, 'Added to the waitlist.')
  } catch (err) {
    next(err)
  }
}

export async function leave(req, res, next) {
  try {
    await waitlistService.leaveWaitlist(req.user._id, req.params.id)
    ok(res, {}, 'Removed from the waitlist.')
  } catch (err) {
    next(err)
  }
}

export async function getStatus(req, res, next) {
  try {
    const [myStatus, queueLength] = await Promise.all([
      waitlistService.getWaitlistStatusForUser(req.user._id, req.params.id),
      waitlistService.getQueueLength(req.params.id),
    ])
    ok(res, { myStatus, queueLength })
  } catch (err) {
    next(err)
  }
}
