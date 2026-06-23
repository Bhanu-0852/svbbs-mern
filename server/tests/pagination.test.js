import { describe, it, expect } from 'vitest'
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js'

describe('parsePagination', () => {
  it('uses defaults when nothing is provided', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 12, skip: 0 })
  })

  it('computes skip from page and limit', () => {
    expect(parsePagination({ page: '3', limit: '10' })).toEqual({ page: 3, limit: 10, skip: 20 })
  })

  it('clamps page to a minimum of 1 for zero or negative input', () => {
    expect(parsePagination({ page: '0' }).page).toBe(1)
    expect(parsePagination({ page: '-5' }).page).toBe(1)
  })

  it('caps limit at the maximum of 50', () => {
    expect(parsePagination({ limit: '999' }).limit).toBe(50)
  })

  it('treats limit=0 as unspecified and uses the default (0 is falsy)', () => {
    // parseInt('0') is 0, which is falsy, so `0 || DEFAULT_LIMIT` yields
    // the default — i.e. ?limit=0 is read as "no limit given" rather than
    // an invalid zero. This is intentional and worth pinning down.
    expect(parsePagination({ limit: '0' }).limit).toBe(12)
  })

  it('caps an explicitly huge limit at the maximum, not the default', () => {
    expect(parsePagination({ limit: '50' }).limit).toBe(50)
    expect(parsePagination({ limit: '51' }).limit).toBe(50)
  })

  it('falls back to defaults for non-numeric input', () => {
    expect(parsePagination({ page: 'abc', limit: 'xyz' })).toEqual({ page: 1, limit: 12, skip: 0 })
  })
})

describe('buildPaginationMeta', () => {
  it('computes totalPages and hasMore for a middle page', () => {
    expect(buildPaginationMeta({ page: 1, limit: 10, total: 25 })).toEqual({
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasMore: true,
    })
  })

  it('reports no more pages on the last page', () => {
    expect(buildPaginationMeta({ page: 3, limit: 10, total: 25 }).hasMore).toBe(false)
  })

  it('always reports at least 1 total page even with zero results', () => {
    expect(buildPaginationMeta({ page: 1, limit: 10, total: 0 }).totalPages).toBe(1)
  })
})
