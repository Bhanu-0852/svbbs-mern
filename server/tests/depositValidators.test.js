import { describe, it, expect } from 'vitest'
import { depositBookSchema, proposeExchangeSchema } from '../validators/depositValidators.js'

const baseBook = {
  title: 'Test Book',
  author: 'Test Author',
  isbn: '9780132350884',
  condition: 'good',
  categoryTags: ['engineering'],
}

describe('depositBookSchema', () => {
  it('accepts a valid plain deposit with no salePrice', () => {
    expect(depositBookSchema.validate({ ...baseBook, depositMethod: 'deposit' }).error).toBeUndefined()
  })

  it('accepts a valid donate with no salePrice', () => {
    expect(depositBookSchema.validate({ ...baseBook, depositMethod: 'donate' }).error).toBeUndefined()
  })

  it('accepts a valid exchange listing with no salePrice', () => {
    expect(depositBookSchema.validate({ ...baseBook, depositMethod: 'exchange' }).error).toBeUndefined()
  })

  it('requires salePrice when depositMethod is sell', () => {
    expect(depositBookSchema.validate({ ...baseBook, depositMethod: 'sell' }).error).toBeDefined()
    expect(depositBookSchema.validate({ ...baseBook, depositMethod: 'sell', salePrice: 250 }).error).toBeUndefined()
  })

  it('rejects salePrice on any method other than sell', () => {
    expect(depositBookSchema.validate({ ...baseBook, depositMethod: 'deposit', salePrice: 100 }).error).toBeDefined()
    expect(depositBookSchema.validate({ ...baseBook, depositMethod: 'donate', salePrice: 100 }).error).toBeDefined()
  })

  it('rejects a zero or negative salePrice', () => {
    expect(depositBookSchema.validate({ ...baseBook, depositMethod: 'sell', salePrice: 0 }).error).toBeDefined()
    expect(depositBookSchema.validate({ ...baseBook, depositMethod: 'sell', salePrice: -50 }).error).toBeDefined()
  })

  it('rejects an unknown depositMethod', () => {
    expect(depositBookSchema.validate({ ...baseBook, depositMethod: 'gift' }).error).toBeDefined()
  })

  it('requires at least one categoryTag', () => {
    expect(depositBookSchema.validate({ ...baseBook, depositMethod: 'deposit', categoryTags: [] }).error).toBeDefined()
  })

  it('rejects an unknown condition', () => {
    expect(
      depositBookSchema.validate({ ...baseBook, depositMethod: 'deposit', condition: 'mint' }).error
    ).toBeDefined()
  })
})

describe('proposeExchangeSchema', () => {
  it('accepts a valid offeredBookId', () => {
    expect(proposeExchangeSchema.validate({ offeredBookId: 'a'.repeat(24) }).error).toBeUndefined()
  })

  it('rejects a malformed offeredBookId', () => {
    expect(proposeExchangeSchema.validate({ offeredBookId: 'not-an-id' }).error).toBeDefined()
  })
})
