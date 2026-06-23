import { describe, it, expect } from 'vitest'
import { topCategoriesByFrequency, rankByCategoryOverlap } from '../utils/recommendationRanking.js'

describe('topCategoriesByFrequency', () => {
  it('ranks categories by borrow count, most-borrowed first', () => {
    expect(topCategoriesByFrequency({ science: 1, medical: 3, general: 2 }, 3)).toEqual([
      'medical',
      'general',
      'science',
    ])
  })

  it('caps the result at N even when more categories exist', () => {
    expect(topCategoriesByFrequency({ a: 5, b: 4, c: 3, d: 2 }, 2)).toEqual(['a', 'b'])
  })

  it('returns an empty array for no history (triggers the cold-start path)', () => {
    expect(topCategoriesByFrequency({}, 3)).toEqual([])
  })
})

describe('rankByCategoryOverlap', () => {
  it('ranks a book matching two top categories above one matching only one', () => {
    const books = [
      { _id: '1', categoryTags: ['science'] },
      { _id: '2', categoryTags: ['science', 'rare'] },
    ]
    const ranked = rankByCategoryOverlap(books, ['science', 'rare'])
    expect(ranked[0].book._id).toBe('2')
    expect(ranked[0].matchedCategories.length).toBe(2)
    expect(ranked[1].matchedCategories.length).toBe(1)
  })

  it('keeps zero-overlap books but sorts them last', () => {
    const books = [
      { _id: 'arts', categoryTags: ['arts'] },
      { _id: 'sci', categoryTags: ['science'] },
    ]
    const ranked = rankByCategoryOverlap(books, ['science'])
    expect(ranked[0].book._id).toBe('sci')
    expect(ranked[1].matchedCategories.length).toBe(0)
  })

  it('handles books with no categoryTags without throwing', () => {
    const ranked = rankByCategoryOverlap([{ _id: 'x' }], ['science'])
    expect(ranked[0].matchedCategories).toEqual([])
  })
})
