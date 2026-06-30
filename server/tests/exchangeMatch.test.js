import { describe, it, expect } from 'vitest'
import { scoreMatch } from '../services/exchangeMatchService.js'

const baseReqBook = { kcValue: 200, condition: 'good', categoryTags: ['engineering'] }
const baseReq = { collegeId: 'c1', department: 'CSE' }

function candidate(overrides = {}) {
  return {
    requesterBook: baseReqBook,
    requester: baseReq,
    candidateBook: { kcValue: 200, condition: 'good', categoryTags: ['engineering'], ...overrides.book },
    candidateOwner: { collegeId: 'c1', department: 'CSE', ...overrides.owner },
  }
}

describe('scoreMatch — KC fairness', () => {
  it('gives a perfect KC-fairness score for an even trade', () => {
    const m = scoreMatch(candidate())
    expect(m.breakdown.kcFairness).toBe(100)
    expect(m.kcDifference).toBe(0)
  })

  it('lowers the score as the KC gap widens', () => {
    const close = scoreMatch(candidate({ book: { kcValue: 220 } }))
    const far = scoreMatch(candidate({ book: { kcValue: 350 } }))
    expect(close.score).toBeGreaterThan(far.score)
  })

  it('floors KC fairness at 0 for an extreme gap', () => {
    // Requester book is 200 KC. Fairness is 1 - gap/300, so a gap of 300+
    // is needed for it to clamp to 0. A 600 KC candidate is a 400 gap,
    // which Math.max(0, ...) floors at 0.
    const m = scoreMatch(candidate({ book: { kcValue: 600, categoryTags: ['arts'] } }))
    expect(m.breakdown.kcFairness).toBe(0)
  })
})

describe('scoreMatch — category fit', () => {
  it('rewards shared categories', () => {
    const same = scoreMatch(candidate({ book: { categoryTags: ['engineering'] } }))
    const different = scoreMatch(candidate({ book: { categoryTags: ['arts'] } }))
    expect(same.breakdown.categoryFit).toBeGreaterThan(different.breakdown.categoryFit)
  })
})

describe('scoreMatch — college & department bonuses', () => {
  it('awards the same-college bonus only when colleges match', () => {
    const match = scoreMatch(candidate({ owner: { collegeId: 'c1' } }))
    const noMatch = scoreMatch(candidate({ owner: { collegeId: 'c2' } }))
    expect(match.breakdown.sameCollege).toBe(true)
    expect(noMatch.breakdown.sameCollege).toBe(false)
    expect(match.score).toBeGreaterThan(noMatch.score)
  })

  it('awards the same-department bonus only when departments match', () => {
    const match = scoreMatch(candidate({ owner: { department: 'CSE' } }))
    const noMatch = scoreMatch(candidate({ owner: { department: 'ECE' } }))
    expect(match.breakdown.sameDept).toBe(true)
    expect(noMatch.breakdown.sameDept).toBe(false)
  })
})

describe('scoreMatch — overall', () => {
  it('caps the score at 100 for a perfect match', () => {
    const m = scoreMatch(candidate())
    expect(m.score).toBeLessThanOrEqual(100)
    expect(m.score).toBeGreaterThan(90)
  })

  it('reports estimated savings as the candidate book value', () => {
    const m = scoreMatch(candidate({ book: { kcValue: 180 } }))
    expect(m.estimatedSavings).toBe(180)
  })
})