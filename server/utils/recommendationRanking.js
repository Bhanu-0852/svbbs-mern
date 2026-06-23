/**
 * Pure ranking helpers for the recommendation engine, extracted from
 * recommendationService.js so they can be unit-tested directly without a
 * live database. The service imports these — the tests exercise the exact
 * same code that ships, not a re-implementation.
 */

/**
 * Given a map of categoryTag -> borrow count, return the top N tags by
 * frequency, most-borrowed first.
 */
export function topCategoriesByFrequency(categoryCounts, n = 3) {
  return Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tag]) => tag)
}

/**
 * Rank candidate books by how many of the user's top categories each one
 * matches (most overlap first). Books with zero overlap still sort to the
 * bottom rather than being dropped here — the caller decides the limit.
 */
export function rankByCategoryOverlap(books, topCategories) {
  return books
    .map((book) => ({
      book,
      matchedCategories: (book.categoryTags || []).filter((tag) => topCategories.includes(tag)),
    }))
    .sort((a, b) => b.matchedCategories.length - a.matchedCategories.length)
}
