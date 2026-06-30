import { aiConfig } from '../config/gemini.js'
import { generateJson } from './ai/aiProvider.js'
import * as bookService from './bookService.js'

const CATEGORIES = ['engineering', 'medical', 'government_exam', 'rare', 'arts', 'science', 'general']
const CONDITIONS = ['excellent', 'good', 'average', 'poor']
const EXAMS = ['UPSC', 'SSC', 'Banking', 'Railways', 'Defence', 'APPSC', 'TSPSC', 'GATE', 'CAT']

// ─── Parse a natural-language query into structured filters via AI ───────────
// Routed through the shared provider layer, so this now gets Gemini's
// flash → flash-lite retry AND a Groq fallback "for free" — the original
// hand-rolled version only ever tried one fixed Gemini model with no
// fallback before dropping straight to the keyword parser below.

async function parseQueryWithAi(naturalQuery) {
  const prompt = `You convert a student's natural-language book search into structured JSON filters for a textbook platform.

Available categories: ${CATEGORIES.join(', ')}
Available conditions: ${CONDITIONS.join(', ')}
Available exam tags: ${EXAMS.join(', ')}

User query: "${naturalQuery}"

Respond ONLY with valid JSON (no markdown, no backticks) in this exact shape. Omit any field that doesn't apply:
{
  "q": "free-text keywords like a title or author, if any",
  "category": "one of the categories above, if implied",
  "exam": "one of the exam tags above, if implied",
  "condition": "one of the conditions above, if implied",
  "maxKc": <number if user mentions a price/KC ceiling like 'under 100'>,
  "minKc": <number if user mentions a price/KC floor>
}

Examples:
"cheap physics books under 100 kc" → {"category":"science","maxKc":100}
"UPSC books in good condition" → {"exam":"UPSC","condition":"good"}
"engineering textbooks by morris mano" → {"category":"engineering","q":"morris mano"}
"books between 50 and 200 credits" → {"minKc":50,"maxKc":200}`

  const { data, provider } = await generateJson({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 300,
    temperature: 0.2,
  })
  return { filters: data, provider }
}

// ─── Keyword-based fallback parser (no AI needed) ─────────────────────────────
// Exported so its logic is directly unit-tested — see
// tests/aiSearchParser.test.js. Keep this export name stable.

export function parseQueryFallback(naturalQuery) {
  const q = naturalQuery.toLowerCase()
  const filters = {}

  // Price ceiling: "under 100", "below 150", "less than 200", "< 100"
  const underMatch = q.match(/(?:under|below|less than|cheaper than|<)\s*(\d+)/)
  if (underMatch) filters.maxKc = Number(underMatch[1])

  // Price floor: "over 50", "above 100", "more than 80"
  const overMatch = q.match(/(?:over|above|more than|>)\s*(\d+)/)
  if (overMatch) filters.minKc = Number(overMatch[1])

  // Range: "between 50 and 200"
  const rangeMatch = q.match(/between\s*(\d+)\s*(?:and|to|-)\s*(\d+)/)
  if (rangeMatch) {
    filters.minKc = Number(rangeMatch[1])
    filters.maxKc = Number(rangeMatch[2])
  }

  // Condition
  for (const c of CONDITIONS) {
    if (q.includes(c)) filters.condition = c
  }
  if (q.includes('new') || q.includes('like new')) filters.condition = 'excellent'

  // Exam tags
  for (const e of EXAMS) {
    if (q.includes(e.toLowerCase())) filters.exam = e
  }

  // Categories (with synonyms). Order matters: check the more specific
  // compound terms first so "computer science" maps to engineering, not
  // the generic "science" branch.
  if (/computer science|comp sci|cse|software/.test(q)) filters.category = 'engineering'
  else if (/engineering|mechanical|electrical|civil/.test(q)) filters.category = 'engineering'
  else if (/physics|chemistry|biology|science/.test(q)) filters.category = 'science'
  else if (/medical|medicine|anatomy|mbbs/.test(q)) filters.category = 'medical'
  else if (/art|history|literature|philosophy/.test(q)) filters.category = 'arts'
  else if (/rare|collector|antique/.test(q)) filters.category = 'rare'

  // Free-text: strip out the structured words, keep the rest as keywords
  const cleaned = q
    .replace(/(?:under|below|less than|over|above|more than|between|and|to)\s*\d+/g, '')
    .replace(/\b(cheap|cheapest|affordable|kc|credits?|books?|book|in|condition|good|excellent|average|poor|new)\b/g, '')
    .replace(/\d+/g, '')
    .trim()
  if (cleaned.length > 2) filters.q = cleaned

  return filters
}

// ─── Main entry: parse + search ───────────────────────────────────────────────

export async function aiSearch(naturalQuery) {
  let filters
  let parsedBy = 'fallback'

  if (!aiConfig.mock) {
    try {
      const result = await parseQueryWithAi(naturalQuery)
      filters = result.filters
      parsedBy = result.provider
    } catch (err) {
      console.warn('[ai-search] AI parse failed, using keyword fallback:', err.message)
    }
  }

  if (!filters) {
    filters = parseQueryFallback(naturalQuery)
  }

  // Clean up empty / invalid values
  const clean = {}
  if (filters.q && String(filters.q).trim()) clean.q = String(filters.q).trim()
  if (CATEGORIES.includes(filters.category)) clean.category = filters.category
  if (EXAMS.includes(filters.exam)) clean.exam = filters.exam
  if (CONDITIONS.includes(filters.condition)) clean.condition = filters.condition
  if (filters.maxKc != null && !isNaN(filters.maxKc)) clean.maxKc = Number(filters.maxKc)
  if (filters.minKc != null && !isNaN(filters.minKc)) clean.minKc = Number(filters.minKc)

  const result = await bookService.listBooks({ ...clean, limit: 24 })

  return {
    query: naturalQuery,
    parsedFilters: clean,
    parsedBy,
    items: result.items,
    pagination: result.pagination,
  }
}