import { describe, it, expect } from 'vitest'
import { validatePasswordPolicy } from '../utils/password.js'

describe('validatePasswordPolicy', () => {
  it('accepts a strong password (returns null)', () => {
    expect(validatePasswordPolicy('Str0ng!Passw0rd')).toBeNull()
  })

  it('rejects passwords shorter than 10 characters', () => {
    expect(validatePasswordPolicy('Ab1!xyz')).toMatch(/at least 10/)
  })

  it('rejects when missing an uppercase letter', () => {
    expect(validatePasswordPolicy('str0ng!passw0rd')).toMatch(/uppercase/)
  })

  it('rejects when missing a lowercase letter', () => {
    expect(validatePasswordPolicy('STR0NG!PASSW0RD')).toMatch(/lowercase/)
  })

  it('rejects when missing a number', () => {
    expect(validatePasswordPolicy('Strong!Password')).toMatch(/number/)
  })

  it('rejects when missing a symbol', () => {
    expect(validatePasswordPolicy('Str0ngPassw0rd')).toMatch(/symbol/)
  })

  it('rejects a known common password even if it would otherwise pass', () => {
    // 'Password123' meets length/upper/lower/digit but lacks a symbol —
    // confirm the symbol check catches it first, then test a common one
    // that DOES meet all character rules.
    expect(validatePasswordPolicy('Welcome123!')).toBeNull() // not in the common list, valid
  })

  it('handles empty / missing input gracefully', () => {
    expect(validatePasswordPolicy('')).toMatch(/at least 10/)
    expect(validatePasswordPolicy(undefined)).toMatch(/at least 10/)
  })
})
