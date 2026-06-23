export const FRAUD_THRESHOLDS = {
  suspiciousIpMinEmails: 3, // distinct emails one IP tried — credential-stuffing signal
  accountUnderAttackMinFails: 3, // below the 5-attempt lockout threshold — an early warning
  highVelocityMinTransactions: 5, // unusually many transactions for one user in the window
}

/**
 * Pure classification rules, extracted from fraudService.js so the
 * actual "what counts as suspicious" thresholds have a direct test
 * rather than only being exercised indirectly through a Mongo
 * aggregation pipeline. The service groups raw data in Mongo (real
 * database work, not pure logic) and hands it to these functions to
 * decide what crosses the line — these are the exact same functions the
 * service imports and calls, not a re-implementation.
 */

export function filterSuspiciousIps(ipGroups, thresholds = FRAUD_THRESHOLDS) {
  return ipGroups
    .filter((g) => g.distinctEmails >= thresholds.suspiciousIpMinEmails)
    .sort((a, b) => b.distinctEmails - a.distinctEmails || b.failCount - a.failCount)
}

export function filterAccountsUnderAttack(emailGroups, thresholds = FRAUD_THRESHOLDS) {
  return emailGroups
    .filter((g) => g.failCount >= thresholds.accountUnderAttackMinFails)
    .sort((a, b) => b.failCount - a.failCount)
}

export function filterHighVelocityUsers(transactionGroups, thresholds = FRAUD_THRESHOLDS) {
  return transactionGroups
    .filter((g) => g.transactionCount >= thresholds.highVelocityMinTransactions)
    .sort((a, b) => b.transactionCount - a.transactionCount)
}
