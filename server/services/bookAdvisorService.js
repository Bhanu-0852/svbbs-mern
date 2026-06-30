import { aiConfig } from '../config/gemini.js'
import { generate } from './ai/aiProvider.js'

/**
 * Answer a student's question about whether a specific book suits them.
 * Grounded in the book's actual details so answers are relevant.
 */
export async function askAboutBook({ question, title, author, categoryTags = [], examTags = [], description = '' }) {
  const cats = categoryTags.join(', ') || 'general'
  const exams = examTags.length ? examTags.join(', ') : 'none specified'
  const desc = description ? `Description: "${description}". ` : ''

  const prompt = `A student is considering borrowing this book and has a question about it.

Book: "${title}" by ${author}
Categories: ${cats}
Relevant exams: ${exams}
${desc}

Student's question: "${question}"

Answer honestly and helpfully in 3-4 sentences. If the book fits their need, explain why. If it might not be ideal, say so and suggest what to look for instead. Be specific and practical. No markdown headers.`

  if (!aiConfig.mock) {
    try {
      const { text } = await generate({
        system: 'You are a helpful academic book advisor. Answer student questions about whether a book fits their needs, honestly and concisely.',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 400,
        temperature: 0.6,
      })
      return { answer: text, source: 'ai' }
    } catch {
      // fall through to the static fallback below
    }
  }

  return {
    answer: `"${title}" by ${author} is categorized under ${cats}${examTags.length ? ` and is tagged for ${exams}` : ''}. To decide if it fits your needs, check whether these categories match your subject, and review the condition and description above. You can always borrow it for 14 days and return it if it's not the right fit — no late fees.`,
    source: 'static',
  }
}