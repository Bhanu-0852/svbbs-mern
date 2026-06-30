import { describe, it, expect } from 'vitest'
import { parseQueryFallback } from '../services/aiSearchService.js'

describe('parseQueryFallback — price parsing', () => {
  it('parses an "under N" ceiling', () => {
    expect(parseQueryFallback('books under 100').maxKc).toBe(100)
    expect(parseQueryFallback('cheaper than 50').maxKc).toBe(50)
    expect(parseQueryFallback('less than 200 kc').maxKc).toBe(200)
  })

  it('parses an "over N" floor', () => {
    expect(parseQueryFallback('books over 50').minKc).toBe(50)
    expect(parseQueryFallback('more than 80 credits').minKc).toBe(80)
  })

  it('parses a "between N and M" range', () => {
    const r = parseQueryFallback('books between 50 and 200')
    expect(r.minKc).toBe(50)
    expect(r.maxKc).toBe(200)
  })

  it('has no price filters when none are mentioned', () => {
    const r = parseQueryFallback('engineering books')
    expect(r.maxKc).toBeUndefined()
    expect(r.minKc).toBeUndefined()
  })
})

describe('parseQueryFallback — condition parsing', () => {
  it('detects each explicit condition word', () => {
    expect(parseQueryFallback('excellent condition books').condition).toBe('excellent')
    expect(parseQueryFallback('good books').condition).toBe('good')
    expect(parseQueryFallback('average copies').condition).toBe('average')
    expect(parseQueryFallback('poor condition').condition).toBe('poor')
  })

  it('maps "new" and "like new" to excellent', () => {
    expect(parseQueryFallback('new physics book').condition).toBe('excellent')
    expect(parseQueryFallback('like new copy').condition).toBe('excellent')
  })
})

describe('parseQueryFallback — category synonyms', () => {
  it('maps science subjects to the science category', () => {
    expect(parseQueryFallback('physics books').category).toBe('science')
    expect(parseQueryFallback('chemistry notes').category).toBe('science')
    expect(parseQueryFallback('biology textbook').category).toBe('science')
  })

  it('maps engineering subjects', () => {
    expect(parseQueryFallback('mechanical engineering').category).toBe('engineering')
    expect(parseQueryFallback('computer science book').category).toBe('engineering')
  })

  it('maps medical subjects', () => {
    expect(parseQueryFallback('mbbs anatomy').category).toBe('medical')
  })

  it('maps arts subjects', () => {
    expect(parseQueryFallback('history of philosophy').category).toBe('arts')
  })
})

describe('parseQueryFallback — exam tags', () => {
  it('detects exam codes case-insensitively', () => {
    expect(parseQueryFallback('upsc prep books').exam).toBe('UPSC')
    expect(parseQueryFallback('GATE material').exam).toBe('GATE')
    expect(parseQueryFallback('books for cat exam').exam).toBe('CAT')
  })
})

describe('parseQueryFallback — combined queries', () => {
  it('parses multiple filters from one natural query', () => {
    const r = parseQueryFallback('cheap physics books under 100 in good condition')
    expect(r.category).toBe('science')
    expect(r.maxKc).toBe(100)
    expect(r.condition).toBe('good')
  })

  it('extracts free-text keywords after stripping structured words', () => {
    const r = parseQueryFallback('morris mano under 150')
    expect(r.maxKc).toBe(150)
    expect(r.q).toContain('morris')
  })
})