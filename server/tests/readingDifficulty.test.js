import { describe, it, expect } from 'vitest'
import { analyzeDifficulty } from '../services/readingDifficultyService.js'

// With no AI provider configured in the test env, analyzeDifficulty falls
// back to the deterministic metadata-based assessment. These tests verify
// that fallback is sensible and always returns a complete, renderable shape.

describe('readingDifficulty — deterministic fallback', () => {
  it('rates a hard-category + advanced-exam book as Advanced', async () => {
    const r = await analyzeDifficulty({
      title: 'GATE Engineering Mathematics',
      author: 'Test',
      categoryTags: ['engineering'],
      examTags: ['GATE'],
    })
    expect(r.level).toBe('Advanced')
    expect(r.estimatedReadingTimeHours).toBeGreaterThan(0)
  })

  it('rates a general book with no advanced signals as Beginner', async () => {
    const r = await analyzeDifficulty({
      title: 'Intro to Reading',
      author: 'Test',
      categoryTags: ['general'],
      examTags: [],
    })
    expect(r.level).toBe('Beginner')
  })

  it('always returns every field the UI renders', async () => {
    const r = await analyzeDifficulty({ title: 'Any Book', categoryTags: ['science'] })
    expect(r.level).toBeTruthy()
    expect(r.estimatedReadingTimeHours).toBeGreaterThan(0)
    expect(r.prerequisites).toBeTruthy()
    expect(r.suitableSemester).toBeTruthy()
    expect(r.learningCurve).toBeTruthy()
  })
})