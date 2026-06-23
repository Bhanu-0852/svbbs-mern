import { describe, it, expect } from 'vitest'
import {
  filterSuspiciousIps,
  filterAccountsUnderAttack,
  filterHighVelocityUsers,
  FRAUD_THRESHOLDS,
} from '../utils/fraudSignals.js'

describe('filterSuspiciousIps', () => {
  it('flags an IP that failed logins against 3+ distinct emails', () => {
    const groups = [
      { ip: '1.2.3.4', distinctEmails: 5, failCount: 8 },
      { ip: '5.6.7.8', distinctEmails: 1, failCount: 4 },
    ]
    const result = filterSuspiciousIps(groups)
    expect(result).toHaveLength(1)
    expect(result[0].ip).toBe('1.2.3.4')
  })

  it('does not flag an IP with failed attempts against only its own account', () => {
    const groups = [{ ip: '9.9.9.9', distinctEmails: 1, failCount: 10 }]
    expect(filterSuspiciousIps(groups)).toHaveLength(0)
  })

  it('sorts by distinct emails first, then fail count as a tiebreaker', () => {
    const groups = [
      { ip: 'low', distinctEmails: 3, failCount: 3 },
      { ip: 'high', distinctEmails: 5, failCount: 1 },
      { ip: 'tie-higher-fails', distinctEmails: 3, failCount: 9 },
    ]
    const result = filterSuspiciousIps(groups)
    expect(result.map((r) => r.ip)).toEqual(['high', 'tie-higher-fails', 'low'])
  })

  it('respects a custom threshold', () => {
    const groups = [{ ip: 'x', distinctEmails: 2, failCount: 2 }]
    expect(filterSuspiciousIps(groups, { ...FRAUD_THRESHOLDS, suspiciousIpMinEmails: 2 })).toHaveLength(1)
    expect(filterSuspiciousIps(groups, { ...FRAUD_THRESHOLDS, suspiciousIpMinEmails: 3 })).toHaveLength(0)
  })
})

describe('filterAccountsUnderAttack', () => {
  it('flags an account with 3+ failed attempts in the window', () => {
    const groups = [
      { email: 'target@svbbs.demo', failCount: 4, distinctIps: 1 },
      { email: 'fine@svbbs.demo', failCount: 1, distinctIps: 1 },
    ]
    const result = filterAccountsUnderAttack(groups)
    expect(result).toHaveLength(1)
    expect(result[0].email).toBe('target@svbbs.demo')
  })

  it('uses a lower threshold than the real 5-attempt lockout, as an early warning', () => {
    expect(FRAUD_THRESHOLDS.accountUnderAttackMinFails).toBeLessThan(5)
  })

  it('sorts by fail count descending', () => {
    const groups = [
      { email: 'a', failCount: 3, distinctIps: 1 },
      { email: 'b', failCount: 6, distinctIps: 1 },
    ]
    expect(filterAccountsUnderAttack(groups).map((r) => r.email)).toEqual(['b', 'a'])
  })
})

describe('filterHighVelocityUsers', () => {
  it('flags a user with 5+ transactions in the window', () => {
    const groups = [
      { userId: '1', transactionCount: 7, totalKcUsed: 500, totalCash: 0 },
      { userId: '2', transactionCount: 2, totalKcUsed: 100, totalCash: 0 },
    ]
    const result = filterHighVelocityUsers(groups)
    expect(result).toHaveLength(1)
    expect(result[0].userId).toBe('1')
  })

  it('does not flag normal activity levels', () => {
    const groups = [{ userId: '1', transactionCount: 1, totalKcUsed: 100, totalCash: 0 }]
    expect(filterHighVelocityUsers(groups)).toHaveLength(0)
  })
})
