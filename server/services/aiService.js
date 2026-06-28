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

const KC_BY_CONDITION = { excellent: 300, good: 220, average: 140, poor: 60 }

function randomInRange([min, max]) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Mock verification (uses stored book condition) ──────────────────────────

function mockVerification(book) {
  const aiScore = randomInRange(SCORE_BANDS[book.condition] || SCORE_BANDS.average)
  return {
    title: book.title,
    isbn: book.isbn,
    authenticity: 'verified',
    condition: book.condition,
    aiScore,
    kcRecommendation: book.kcValue,
    report: REPORT_TEMPLATES[book.condition](book.title),
    mock: true,
  }
}

export async function verifyBookCondition(bookId) {
  const book = await Book.findById(bookId)
  if (!book) throw fail(404, 'Book not found.')
  await sleep(600 + Math.random() * 600)
  return mockVerification(book)
}

// ─── Real photo verification via Gemini Vision (free) ────────────────────────

async function callGeminiVision(base64Image, mimeType) {
  const prompt = `You are an expert book condition assessor for a textbook exchange platform. Analyze this photo of a book and assess its physical condition.

Respond ONLY with a valid JSON object (no markdown, no backticks) in exactly this format:
{
  "detectedTitle": "the book title if visible, else 'Unknown'",
  "condition": "excellent" | "good" | "average" | "poor",
  "aiScore": <number 0-100>,
  "observations": ["short observation 1", "short observation 2", "short observation 3"],
  "report": "a 2-3 sentence professional condition assessment"
}

Grading guide:
- excellent (90-99): like new, no visible wear, crisp cover, clean pages
- good (75-89): light wear, minor edge wear, maybe small marks
- average (55-74): moderate wear, visible creasing, some highlighting/notes
- poor (25-54): heavy wear, damage, loose pages, recommend recycling`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${aiConfig.model}:generateContent?key=${aiConfig.apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Image } },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 600, temperature: 0.4 },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`Gemini Vision ${res.status}: ${text}`)
    err.status = res.status
    throw err
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini Vision returned empty response')

  // Strip any accidental markdown fences and parse JSON
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

/**
 * Analyze an uploaded book photo. Falls back to a sensible mock result
 * if no Gemini key is configured or the vision call fails.
 */
export async function verifyBookPhoto(base64Image, mimeType, bookId = null) {
  const book = bookId ? await Book.findById(bookId) : null

  if (!aiConfig.mock && aiConfig.apiKey) {
    try {
      const result = await callGeminiVision(base64Image, mimeType)
      const condition = ['excellent', 'good', 'average', 'poor'].includes(result.condition)
        ? result.condition
        : 'average'
      return {
        title: result.detectedTitle || book?.title || 'Scanned book',
        condition,
        aiScore: result.aiScore ?? randomInRange(SCORE_BANDS[condition]),
        kcRecommendation: KC_BY_CONDITION[condition],
        observations: result.observations || [],
        report: result.report || REPORT_TEMPLATES[condition](result.detectedTitle || 'This book'),
        mock: false,
        source: 'gemini-vision',
      }
    } catch (err) {
      console.warn('[ai] Gemini Vision failed, using mock:', err.message)
    }
  }

  // Mock fallback — pick a condition with a realistic distribution
  await sleep(800 + Math.random() * 700)
  const conditions = ['excellent', 'good', 'good', 'average', 'average', 'poor']
  const condition = conditions[Math.floor(Math.random() * conditions.length)]
  return {
    title: book?.title || 'Scanned book',
    condition,
    aiScore: randomInRange(SCORE_BANDS[condition]),
    kcRecommendation: KC_BY_CONDITION[condition],
    observations: [
      'Cover and spine analyzed',
      'Page edges and binding checked',
      'Overall wear pattern assessed',
    ],
    report: REPORT_TEMPLATES[condition](book?.title || 'This book'),
    mock: true,
    source: 'mock',
  }
}