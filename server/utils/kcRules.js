const BASE_KC = {
  excellent: 300,
  good: 200,
  average: 100,
  poor: 25,
}

const CATEGORY_BONUS = {
  engineering: 50,
  government_exam: 50,
  medical: 75,
  rare: 100,
}

/**
 * @param {string} condition - 'excellent' | 'good' | 'average' | 'poor'
 * @param {string[]} categoryTags - any of 'engineering' | 'government_exam' | 'medical' | 'rare'
 */
export function calculateKcValue(condition, categoryTags = []) {
  const base = BASE_KC[condition] ?? BASE_KC.average
  const bonus = categoryTags.reduce((sum, tag) => sum + (CATEGORY_BONUS[tag] || 0), 0)
  return base + bonus
}

export { BASE_KC, CATEGORY_BONUS }
