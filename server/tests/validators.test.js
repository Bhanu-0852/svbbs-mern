import { describe, it, expect } from 'vitest'
import { grantSchema, sponsorBookSchema } from '../validators/csrValidators.js'
import { topUpSchema } from '../validators/parentValidators.js'
import { loginSchema, registerSchema, forgotPasswordSchema } from '../validators/authValidators.js'
import { scholarshipSchema } from '../validators/collegeValidators.js'

const validId = 'a'.repeat(24)

describe('auth email validation (regression: .demo TLD bug)', () => {
  // Found via a real deployment, not sandbox testing: Joi's .email() checks
  // the domain's TLD against a real-world allowlist by default, and the
  // made-up ".demo" TLD used by every seeded demo account isn't on it — so
  // every single demo login was rejected with "email must be a valid email"
  // until tlds:{allow:false} was added. This pins that fix down for good.
  it('accepts every seeded demo account email on login', () => {
    const demoEmails = [
      'vendor@svbbs.demo',
      'student@svbbs.demo',
      'admin@svbbs.demo',
      'recycler@svbbs.demo',
      'college@svbbs.demo',
      'csr@svbbs.demo',
      'parent@svbbs.demo',
    ]
    demoEmails.forEach((email) => {
      expect(loginSchema.validate({ email, password: 'x' }).error).toBeUndefined()
    })
  })

  it('accepts a .demo email on register and forgot-password too', () => {
    expect(
      registerSchema.validate({ name: 'Test User', email: 'new@svbbs.demo', password: 'Str0ng!Passw0rd' }).error
    ).toBeUndefined()
    expect(forgotPasswordSchema.validate({ email: 'student@svbbs.demo' }).error).toBeUndefined()
  })

  it('still accepts ordinary real-world email domains', () => {
    expect(loginSchema.validate({ email: 'real.person@gmail.com', password: 'x' }).error).toBeUndefined()
  })

  it('still rejects genuinely malformed email input', () => {
    expect(loginSchema.validate({ email: 'not-an-email', password: 'x' }).error).toBeDefined()
    expect(loginSchema.validate({ email: 'missing-at-sign.com', password: 'x' }).error).toBeDefined()
  })
})

describe('csr grantSchema', () => {
  it('accepts a valid grant', () => {
    expect(grantSchema.validate({ studentId: validId, kcAmount: 100, note: 'Scholarship' }).error).toBeUndefined()
  })

  it('accepts a grant with no note (optional)', () => {
    expect(grantSchema.validate({ studentId: validId, kcAmount: 100 }).error).toBeUndefined()
  })

  it('rejects zero and negative amounts', () => {
    expect(grantSchema.validate({ studentId: validId, kcAmount: 0 }).error).toBeDefined()
    expect(grantSchema.validate({ studentId: validId, kcAmount: -10 }).error).toBeDefined()
  })

  it('rejects non-integer amounts', () => {
    expect(grantSchema.validate({ studentId: validId, kcAmount: 10.5 }).error).toBeDefined()
  })

  it('enforces the 5000 cap at the boundary', () => {
    expect(grantSchema.validate({ studentId: validId, kcAmount: 5000 }).error).toBeUndefined()
    expect(grantSchema.validate({ studentId: validId, kcAmount: 5001 }).error).toBeDefined()
  })

  it('rejects a malformed studentId', () => {
    expect(grantSchema.validate({ studentId: 'nope', kcAmount: 100 }).error).toBeDefined()
  })

  it('rejects an over-long note', () => {
    expect(grantSchema.validate({ studentId: validId, kcAmount: 100, note: 'x'.repeat(201) }).error).toBeDefined()
  })
})

describe('csr sponsorBookSchema', () => {
  it('accepts a valid sponsor-book request', () => {
    expect(sponsorBookSchema.validate({ studentId: validId, bookId: validId }).error).toBeUndefined()
  })

  it('accepts an optional note', () => {
    expect(
      sponsorBookSchema.validate({ studentId: validId, bookId: validId, note: 'For her engineering coursework' })
        .error
    ).toBeUndefined()
  })

  it('requires both studentId and bookId', () => {
    expect(sponsorBookSchema.validate({ bookId: validId }).error).toBeDefined()
    expect(sponsorBookSchema.validate({ studentId: validId }).error).toBeDefined()
  })

  it('rejects malformed ids', () => {
    expect(sponsorBookSchema.validate({ studentId: 'nope', bookId: validId }).error).toBeDefined()
    expect(sponsorBookSchema.validate({ studentId: validId, bookId: 'nope' }).error).toBeDefined()
  })
})

describe('parent topUpSchema', () => {
  it('accepts a valid top-up', () => {
    expect(topUpSchema.validate({ studentId: validId, kcAmount: 200 }).error).toBeUndefined()
  })

  it('enforces the same 1–5000 bounds', () => {
    expect(topUpSchema.validate({ studentId: validId, kcAmount: 0 }).error).toBeDefined()
    expect(topUpSchema.validate({ studentId: validId, kcAmount: 5000 }).error).toBeUndefined()
    expect(topUpSchema.validate({ studentId: validId, kcAmount: 5001 }).error).toBeDefined()
  })

  it('rejects a malformed studentId', () => {
    expect(topUpSchema.validate({ studentId: 'bad', kcAmount: 100 }).error).toBeDefined()
  })
})

describe('college scholarshipSchema', () => {
  it('accepts a valid scholarship', () => {
    expect(scholarshipSchema.validate({ studentId: validId, kcAmount: 300 }).error).toBeUndefined()
  })

  it('enforces the same 1–5000 bounds as CSR grants and parent top-ups', () => {
    expect(scholarshipSchema.validate({ studentId: validId, kcAmount: 0 }).error).toBeDefined()
    expect(scholarshipSchema.validate({ studentId: validId, kcAmount: 5000 }).error).toBeUndefined()
    expect(scholarshipSchema.validate({ studentId: validId, kcAmount: 5001 }).error).toBeDefined()
  })

  it('rejects a malformed studentId', () => {
    expect(scholarshipSchema.validate({ studentId: 'bad', kcAmount: 100 }).error).toBeDefined()
  })

  it('accepts an optional note and rejects an over-long one', () => {
    expect(scholarshipSchema.validate({ studentId: validId, kcAmount: 100, note: 'Merit scholarship' }).error).toBeUndefined()
    expect(scholarshipSchema.validate({ studentId: validId, kcAmount: 100, note: 'x'.repeat(201) }).error).toBeDefined()
  })
})
