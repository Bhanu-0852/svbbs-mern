import { describe, it, expect } from 'vitest'
import { calculateKcValue, BASE_KC, CATEGORY_BONUS } from '../utils/kcRules.js'

describe('calculateKcValue', () => {
  it('returns the base value for each condition with no category bonus', () => {
    expect(calculateKcValue('excellent', [])).toBe(BASE_KC.excellent)
    expect(calculateKcValue('good', [])).toBe(BASE_KC.good)
    expect(calculateKcValue('average', [])).toBe(BASE_KC.average)
    expect(calculateKcValue('poor', [])).toBe(BASE_KC.poor)
  })

  it('adds a single category bonus on top of the base', () => {
    expect(calculateKcValue('good', ['engineering'])).toBe(BASE_KC.good + CATEGORY_BONUS.engineering)
    expect(calculateKcValue('excellent', ['rare'])).toBe(BASE_KC.excellent + CATEGORY_BONUS.rare)
  })

  it('sums multiple category bonuses', () => {
    const expected = BASE_KC.good + CATEGORY_BONUS.engineering + CATEGORY_BONUS.rare
    expect(calculateKcValue('good', ['engineering', 'rare'])).toBe(expected)
  })

  it('ignores categories that carry no bonus', () => {
    expect(calculateKcValue('average', ['general', 'arts'])).toBe(BASE_KC.average)
  })

  it('falls back to the average base for an unknown condition', () => {
    expect(calculateKcValue('pristine', [])).toBe(BASE_KC.average)
    expect(calculateKcValue(undefined, [])).toBe(BASE_KC.average)
  })

  it('defaults categoryTags to an empty array when omitted', () => {
    expect(calculateKcValue('good')).toBe(BASE_KC.good)
  })
})
