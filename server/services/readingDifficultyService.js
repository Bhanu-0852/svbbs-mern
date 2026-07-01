import { generateJson } from './ai/aiProvider.js'
import { aiConfig } from '../config/gemini.js'

/**
 * ─── AI Reading Difficulty Analyzer ─────────────────────────────────────────
 *
 * Assesses how hard a book is to read: a difficulty level, estimated reading
 * time, prerequisites, and which semester it suits. The AI grounds its answer
 * in the book's real metadata (categories, exam tags, description), and a
 * deterministic fallback derives a sensible assessment from that same
 * metadata when no AI provider is available — so the feature never returns
 * nothing, and never invents data it can't support.
 *
 * Honest framing: this is an AI-assisted assessment, not a validated
 * readability score (like Flesch-Kincaid computed on the full text, which
 * we don't have). It's labeled as an estimate in the UI.
 */

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

// Categories that tend to signal a harder read, used by the fallback to make
// a defensible guess from metadata alone rather than a random one.
const HARDER_CATEGORIES = new Set(['medical', 'engineering', 'rare'])
const EXAM_TAGS_HINT_ADVANCED = new Set(['GATE', 'UPSC', 'CAT'])

/**
 * Deterministic fallback: derive a difficulty assessment from the metadata
 * we already have. Transparent and explainable — no black box.
 */
function buildFallbackAssessment({ title, categoryTags = [], examTags = [] }) {
  const hasHardCategory = categoryTags.some((c) => HARDER_CATEGORIES.has(c))
  const hasAdvancedExam = examTags.some((e) => EXAM_TAGS_HINT_ADVANCED.has(e))

  let level = 'Intermediate'
  if (hasHardCategory && hasAdvancedExam) level = 'Advanced'
  else if (!hasHardCategory && !hasAdvancedExam) level = 'Beginner'

  const readingTimeHours = level === 'Advanced' ? 25 : level === 'Intermediate' ? 15 : 8
  const suitableSemester =
    level === 'Advanced' ? '5th–8th semester' : level === 'Intermediate' ? '3rd–5th semester' : '1st–3rd semester'

  return {
    level,
    estimatedReadingTimeHours: readingTimeHours,
    prerequisites:
      level === 'Advanced'
        ? 'Solid grounding in the core subject fundamentals is recommended before starting.'
        : level === 'Intermediate'
          ? 'Some prior familiarity with the basics will help.'
          : 'No special prerequisites — suitable for newcomers to the subject.',
    suitableSemester,
    learningCurve:
      level === 'Advanced'
        ? 'Steep — dense material that rewards steady, consistent study.'
        : level === 'Intermediate'
          ? 'Moderate — approachable with regular effort.'
          : 'Gentle — designed to build understanding from the ground up.',
    source: 'fallback',
  }
}

/**
 * Analyze a book's reading difficulty. Returns a structured assessment the
 * UI renders as visual indicators (level pill, time, semester, curve).
 */
export async function analyzeDifficulty({ title, author, categoryTags = [], examTags = [], description = '' }) {
  const cats = categoryTags.join(', ') || 'general'
  const exams = examTags.length ? examTags.join(', ') : 'none'
  const desc = description ? `Description: "${description}". ` : ''

  const prompt = `Assess the reading difficulty of this book for a college student.

Book: "${title}" by ${author}
Categories: ${cats}
Relevant exams: ${exams}
${desc}

Respond ONLY with valid JSON (no markdown) in this exact shape:
{
  "level": "Beginner" | "Intermediate" | "Advanced",
  "estimatedReadingTimeHours": <number, total hours to read thoroughly>,
  "prerequisites": "one sentence on what a reader should already know",
  "suitableSemester": "e.g. '3rd–5th semester'",
  "learningCurve": "one sentence describing how steep the learning curve is"
}
Base your assessment on the subject matter and typical depth of such a book. Be realistic.`

  if (!aiConfig.mock) {
    try {
      const { data } = await generateJson({
        system: 'You are an academic advisor who assesses how difficult textbooks are for college students. Be realistic and specific.',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 400,
        temperature: 0.4,
      })

      // Validate the AI's level is one we expect; otherwise fall back so the
      // UI never receives a garbage value it can't render.
      if (data && LEVELS.includes(data.level)) {
        return { ...data, source: 'ai' }
      }
    } catch {
      // fall through to deterministic fallback
    }
  }

  return buildFallbackAssessment({ title, categoryTags, examTags })
}