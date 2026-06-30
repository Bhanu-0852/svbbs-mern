import Book from '../models/Book.js'
import User from '../models/User.js'
import { calculateKcValue } from '../utils/kcRules.js'
import { generate } from './ai/aiProvider.js'

/**
 * ─── AI Smart Exchange Matching ─────────────────────────────────────────────
 *
 * Finds the best exchange partners for a book its owner wants to swap.
 *
 * The match QUALITY is computed by a deterministic scoring algorithm — not by
 * asking an AI to guess — so every score is explainable and testable. The AI
 * layer only adds a short natural-language rationale on top of a match the
 * algorithm already chose. This is the honest division of labour used
 * throughout SVBBS: real logic decides, AI explains.
 *
 * Score (0–100) is a weighted sum of signals a human would actually use when
 * deciding whether a swap is fair and convenient:
 *   - KC fairness   (40): how close the two books' KC values are
 *   - Category fit  (30): overlap between what the partner offers and the
 *                         categories the requester's book belongs to
 *   - Same college  (15): easier hand-off, shared context
 *   - Same dept     (10): more likely to want each other's subjects
 *   - Availability  (5):  partner has an available book to offer at all
 */

const WEIGHTS = {
  kcFairness: 40,
  categoryFit: 30,
  sameCollege: 15,
  sameDept: 10,
  hasOffer: 5,
}

// KC fairness: 100% when values are equal, decaying to 0 as the gap grows.
// A 300-KC gap (e.g. a 25-KC book vs a 325-KC book) scores ~0.
function kcFairnessRatio(valueA, valueB) {
  const gap = Math.abs(valueA - valueB)
  return Math.max(0, 1 - gap / 300)
}

// Category fit: Jaccard-style overlap between the two books' category tags.
function categoryOverlapRatio(tagsA = [], tagsB = []) {
  if (!tagsA.length || !tagsB.length) return 0
  const setB = new Set(tagsB)
  const shared = tagsA.filter((t) => setB.has(t)).length
  const union = new Set([...tagsA, ...tagsB]).size
  return union ? shared / union : 0
}

/**
 * Scores one candidate (a partner's offerable book) against the requester's
 * book + profile. Returns a 0–100 score plus a transparent breakdown so the
 * UI can show exactly WHY a match is good — never a black box.
 */
export function scoreMatch({ requesterBook, requester, candidateBook, candidateOwner }) {
  const reqValue = requesterBook.kcValue ?? calculateKcValue(requesterBook.condition, requesterBook.categoryTags)
  const candValue = candidateBook.kcValue ?? calculateKcValue(candidateBook.condition, candidateBook.categoryTags)

  const kcFairness = kcFairnessRatio(reqValue, candValue)
  const categoryFit = categoryOverlapRatio(requesterBook.categoryTags, candidateBook.categoryTags)
  const sameCollege = requester.collegeId && candidateOwner.collegeId &&
    String(requester.collegeId) === String(candidateOwner.collegeId) ? 1 : 0
  const sameDept = requester.department && candidateOwner.department &&
    requester.department === candidateOwner.department ? 1 : 0
  const hasOffer = 1 // candidate only enters scoring if they have an offerable book

  const score = Math.round(
    kcFairness * WEIGHTS.kcFairness +
      categoryFit * WEIGHTS.categoryFit +
      sameCollege * WEIGHTS.sameCollege +
      sameDept * WEIGHTS.sameDept +
      hasOffer * WEIGHTS.hasOffer
  )

  return {
    score,
    breakdown: {
      kcFairness: Math.round(kcFairness * 100),
      categoryFit: Math.round(categoryFit * 100),
      sameCollege: Boolean(sameCollege),
      sameDept: Boolean(sameDept),
    },
    kcDifference: Math.abs(reqValue - candValue),
    estimatedSavings: candValue, // what the requester would otherwise spend to borrow it
  }
}

// Builds a one-line, human-readable reason from the breakdown — used as the
// instant fallback when AI is unavailable, and as grounding for the AI version.
function plainReason(match, candidateBook) {
  const bits = []
  if (match.kcDifference === 0) bits.push('an exactly even KC trade')
  else if (match.kcDifference <= 50) bits.push(`only a ${match.kcDifference} KC difference`)
  if (match.breakdown.categoryFit >= 50) bits.push('the same subject area')
  if (match.breakdown.sameCollege) bits.push('the same college')
  if (match.breakdown.sameDept) bits.push('your department')
  const why = bits.length ? bits.join(', ') : 'a reasonable overall fit'
  return `"${candidateBook.title}" is a strong match — ${why}.`
}

/**
 * Main entry: find and rank the best exchange matches for a requester's book.
 * @param {string} requesterBookId  the book the requester wants to swap away
 * @param {string} requesterId
 * @param {number} limit
 */
export async function findMatches(requesterBookId, requesterId, limit = 5) {
  const [requesterBook, requester] = await Promise.all([
    Book.findById(requesterBookId),
    User.findById(requesterId).select('collegeId department'),
  ])
  if (!requesterBook) throw new Error('Book not found')

  // Candidates: other people's books that are listed for exchange and aren't
  // the requester's own. We rank these as potential things to receive.
  const candidates = await Book.find({
    depositMethod: 'exchange',
    status: 'available',
    ownerId: { $ne: requesterId },
  })
    .populate('ownerId', 'name collegeId department')
    .limit(50)

  const scored = candidates
    .filter((c) => c.ownerId) // owner must still exist
    .map((candidateBook) => {
      const match = scoreMatch({
        requesterBook,
        requester: requester || {},
        candidateBook,
        candidateOwner: candidateBook.ownerId,
      })
      return {
        book: {
          _id: candidateBook._id,
          title: candidateBook.title,
          author: candidateBook.author,
          coverImage: candidateBook.coverImage,
          kcValue: candidateBook.kcValue,
          categoryTags: candidateBook.categoryTags,
        },
        owner: { name: candidateBook.ownerId.name },
        ...match,
        reason: plainReason(match, candidateBook),
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return {
    requesterBook: { _id: requesterBook._id, title: requesterBook.title },
    matches: scored,
  }
}

/**
 * Optional AI enhancement: rewrite the top match's reason into a warmer,
 * more specific sentence. Falls back silently to the deterministic reason
 * if AI is unavailable — the matches themselves never depend on AI.
 */
export async function enhanceTopMatchReason(result) {
  if (!result.matches.length) return result
  const top = result.matches[0]
  try {
    const { text } = await generate({
      system: 'You write one short, friendly sentence explaining why a book swap is a good match for a student. No markdown.',
      messages: [
        {
          role: 'user',
          content: `The student wants to swap away "${result.requesterBook.title}". The best match is "${top.book.title}" with a match score of ${top.score}/100, a KC difference of ${top.kcDifference}, ${top.breakdown.categoryFit}% category overlap${top.breakdown.sameCollege ? ', same college' : ''}${top.breakdown.sameDept ? ', same department' : ''}. Write one sentence explaining why this is a good swap.`,
        },
      ],
      maxTokens: 120,
      temperature: 0.6,
    })
    top.reason = text
    top.aiEnhanced = true
  } catch {
    // Keep the deterministic reason — matches are unaffected.
  }
  return result
}