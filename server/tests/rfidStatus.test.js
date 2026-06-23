import { describe, it, expect } from 'vitest'
import { nextRfidStatus } from '../utils/rfidStatus.js'

describe('nextRfidStatus', () => {
  it('flips checked_in to checked_out', () => {
    expect(nextRfidStatus('checked_in')).toBe('checked_out')
  })

  it('flips checked_out to checked_in', () => {
    expect(nextRfidStatus('checked_out')).toBe('checked_in')
  })

  it('toggling twice returns to the original status', () => {
    expect(nextRfidStatus(nextRfidStatus('checked_in'))).toBe('checked_in')
  })

  it('throws on an unknown status rather than silently guessing', () => {
    expect(() => nextRfidStatus('lost')).toThrow(/Unknown RFID status/)
    expect(() => nextRfidStatus(undefined)).toThrow(/Unknown RFID status/)
  })
})
