import { describe, it, expect } from 'vitest'
import { pickNextWaiting, canUserBorrow } from '../utils/waitlistQueue.js'

describe('pickNextWaiting', () => {
  it('promotes the oldest waiting entry (FIFO)', () => {
    const entries = [
      { userId: 'late', status: 'waiting', createdAt: '2025-01-02' },
      { userId: 'early', status: 'waiting', createdAt: '2025-01-01' },
    ]
    expect(pickNextWaiting(entries).userId).toBe('early')
  })

  it('skips cancelled and claimed entries', () => {
    const entries = [
      { userId: 'gone', status: 'cancelled', createdAt: '2024-01-01' },
      { userId: 'done', status: 'claimed', createdAt: '2024-06-01' },
      { userId: 'next', status: 'waiting', createdAt: '2025-01-01' },
    ]
    expect(pickNextWaiting(entries).userId).toBe('next')
  })

  it('returns null when nobody is waiting', () => {
    expect(pickNextWaiting([{ userId: 'x', status: 'ready', createdAt: '2025-01-01' }])).toBeNull()
    expect(pickNextWaiting([])).toBeNull()
  })
})

describe('canUserBorrow', () => {
  it('allows borrowing an available book', () => {
    expect(canUserBorrow({ status: 'available' }, 'user-A')).toBe(true)
  })

  it('blocks borrowing an on-loan book', () => {
    expect(canUserBorrow({ status: 'on_loan' }, 'user-A')).toBe(false)
  })

  it('lets the reserved-for user claim their reserved copy', () => {
    expect(canUserBorrow({ status: 'reserved', reservedForUserId: 'user-A' }, 'user-A')).toBe(true)
  })

  it('does NOT let a third party steal a copy reserved for someone else', () => {
    expect(canUserBorrow({ status: 'reserved', reservedForUserId: 'user-A' }, 'user-B')).toBe(false)
  })

  it('blocks borrowing a recycled book', () => {
    expect(canUserBorrow({ status: 'recycled' }, 'user-A')).toBe(false)
  })
})
