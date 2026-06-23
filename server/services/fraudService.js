import LoginAttempt from '../models/LoginAttempt.js'
import Transaction from '../models/Transaction.js'
import { filterSuspiciousIps, filterAccountsUnderAttack, filterHighVelocityUsers } from '../utils/fraudSignals.js'

const WINDOW_HOURS = 24

function windowStart() {
  return new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000)
}

/**
 * Real heuristics over data this app already collects honestly —
 * LoginAttempt and Transaction — not a trained model or invented score.
 * Mongo does the grouping (real database aggregation); the actual
 * "what counts as suspicious" thresholds live in utils/fraudSignals.js
 * as plain, directly-tested functions, not buried in pipeline stages.
 * Each signal is a defensible, explainable rule a human reviewer can
 * verify, matching the same "simple ranking, not AI" honesty already
 * used for recommendationService.js. Nothing here auto-blocks anyone;
 * it surfaces patterns for a super admin to look at.
 */
export async function getFraudSignals() {
  const since = windowStart()

  const [ipGroups, emailGroups, transactionGroups] = await Promise.all([
    // One IP failing logins against several different email addresses in
    // a short window looks like someone trying a list of accounts, not
    // someone forgetting their own password.
    LoginAttempt.aggregate([
      { $match: { success: false, createdAt: { $gte: since } } },
      { $group: { _id: '$ip', emails: { $addToSet: '$email' }, failCount: { $sum: 1 } } },
      { $project: { ip: '$_id', _id: 0, distinctEmails: { $size: '$emails' }, failCount: 1 } },
    ]),
    // Early warning for one specific account being targeted, surfaced
    // before the existing lockout mechanism would even kick in.
    LoginAttempt.aggregate([
      { $match: { success: false, createdAt: { $gte: since } } },
      { $group: { _id: '$email', failCount: { $sum: 1 }, ips: { $addToSet: '$ip' } } },
      { $project: { email: '$_id', _id: 0, failCount: 1, distinctIps: { $size: '$ips' } } },
    ]),
    // Unusual transaction velocity: far more borrows/sells in a day than
    // a real student would normally make — worth a human glance, not an
    // accusation. Could be a compromised account, could be a power user.
    Transaction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: '$userId',
          transactionCount: { $sum: 1 },
          totalKcUsed: { $sum: '$kcUsed' },
          totalCash: { $sum: '$cashDue' },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          role: '$user.role',
          transactionCount: 1,
          totalKcUsed: 1,
          totalCash: 1,
        },
      },
    ]),
  ])

  return {
    windowHours: WINDOW_HOURS,
    suspiciousIps: filterSuspiciousIps(ipGroups).slice(0, 10),
    accountsUnderAttack: filterAccountsUnderAttack(emailGroups).slice(0, 10),
    highVelocityUsers: filterHighVelocityUsers(transactionGroups).slice(0, 10),
  }
}
