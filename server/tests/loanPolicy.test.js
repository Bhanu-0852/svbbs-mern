import { describe, it, expect } from 'vitest'
import { calculateDueDate, classifyDueStatus, LOAN_PERIOD_DAYS, DUE_SOON_WINDOW_DAYS } from '../utils/loanPolicy.js'

describe('calculateDueDate', () => {
  it('adds exactly LOAN_PERIOD_DAYS to the borrow date', () => {
    const borrowedAt = new Date('2026-01-01T00:00:00.000Z')
    const due = calculateDueDate(borrowedAt)
    const diffDays = (due.getTime() - borrowedAt.getTime()) / (24 * 60 * 60 * 1000)
    expect(diffDays).toBe(LOAN_PERIOD_DAYS)
  })

  it('defaults to now when no borrow date is given', () => {
    const before = Date.now()
    const due = calculateDueDate()
    const after = Date.now()
    const diffDaysFromBefore = (due.getTime() - before) / (24 * 60 * 60 * 1000)
    const diffDaysFromAfter = (due.getTime() - after) / (24 * 60 * 60 * 1000)
    expect(diffDaysFromBefore).toBeGreaterThanOrEqual(LOAN_PERIOD_DAYS - 0.001)
    expect(diffDaysFromAfter).toBeLessThanOrEqual(LOAN_PERIOD_DAYS + 0.001)
  })
})

describe('classifyDueStatus', () => {
  const now = new Date('2026-06-15T12:00:00.000Z')

  it('returns ok for no due date at all (book not on loan)', () => {
    expect(classifyDueStatus(null, now)).toBe('ok')
  })

  it('returns ok when the due date is well in the future', () => {
    const farOut = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
    expect(classifyDueStatus(farOut, now)).toBe('ok')
  })

  it('returns due_soon inside the warning window', () => {
    const dueSoon = new Date(now.getTime() + (DUE_SOON_WINDOW_DAYS - 0.5) * 24 * 60 * 60 * 1000)
    expect(classifyDueStatus(dueSoon, now)).toBe('due_soon')
  })

  it('returns due_soon exactly at the warning window boundary', () => {
    const boundary = new Date(now.getTime() + DUE_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    expect(classifyDueStatus(boundary, now)).toBe('due_soon')
  })

  it('returns overdue once the due date has passed', () => {
    const past = new Date(now.getTime() - 60 * 60 * 1000)
    expect(classifyDueStatus(past, now)).toBe('overdue')
  })

  it('returns overdue for a due date far in the past', () => {
    const longPast = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    expect(classifyDueStatus(longPast, now)).toBe('overdue')
  })
})
