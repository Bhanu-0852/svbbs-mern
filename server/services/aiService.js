import { aiConfig } from '../config/gemini.js'
import Book from '../models/Book.js'
import { fail } from '../utils/response.js'

const SCORE_BANDS = {
  excellent: [90, 99],
  good: [75, 89],
  average: [55, 74],
  poor: [25, 54],
}

const REPORT_TEMPLATES = {
  excellent: (title) =>
    `${title} shows minimal wear. Cover and spine are intact with no creasing, pages are clean with no markings, and binding is tight. This copy is in excellent condition for resale or reuse.`,
  good: (title) =>
    `${title} shows light wear consistent with normal use. Minor cover edge wear and a small number of pencil annotations were detected; binding remains solid. Good condition overall.`,
  average: (title) =>
    `${title} shows moderate wear. Some highlighting and underlining present throughout, cover has visible creasing, and a few pages show minor edge damage. Average condition, fully usable.`,
  poor: (title) =>
    `${title} shows significant wear. Heavy annotation, loose or detached pages, and notable cover damage were detected. Poor condition — recommended for recycling rather than resale.`,
}

function randomInRange([min, max]) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Mock implementation: deterministic-ish per the book's stored condition,
 * with a small artificial delay to mimic real model latency. Swappable
 * for a real Gemini call by replacing the body of this function once
 * MOCK_AI=false and GEMINI_API_KEY is set — the calling code never
 * changes (see aiConfig in config/gemini.js).
 */
export async function verifyBookCondition(bookId) {
  const book = await Book.findById(bookId)
  if (!book) throw fail(404, 'Book not found.')

  if (!aiConfig.mock) {
    // Real Gemini integration point — left as a clear extension seam.
    throw fail(501, 'Live Gemini verification is not configured yet. Set MOCK_AI=true to use the demo mode.')
  }

  await sleep(600 + Math.random() * 600)

  const aiScore = randomInRange(SCORE_BANDS[book.condition] || SCORE_BANDS.average)
  const report = REPORT_TEMPLATES[book.condition](book.title)

  return {
    title: book.title,
    isbn: book.isbn,
    authenticity: 'verified',
    condition: book.condition,
    aiScore,
    kcRecommendation: book.kcValue,
    report,
    mock: true,
  }
}
