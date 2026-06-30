import { aiConfig } from '../config/gemini.js'
import { generate } from './ai/aiProvider.js'

export async function generateBookSummary({ title, author, categoryTags = [], description = '' }) {
  const categories = categoryTags.join(', ') || 'general'
  const existingDesc = description ? `The platform description says: "${description}". ` : ''

  const prompt = `${existingDesc}Write a helpful 3-4 sentence summary of the book "${title}" by ${author} (categories: ${categories}). Cover: what the book is about, what topics it covers, and who would benefit most from reading it. Write directly and clearly for a student deciding whether to borrow it.`

  if (!aiConfig.mock) {
    try {
      const { text } = await generate({
        system: 'You are a knowledgeable book advisor. Write concise, helpful book summaries for students.',
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 300,
        temperature: 0.6,
      })
      return { summary: text, source: 'ai' }
    } catch {
      // fall through to the static fallback below
    }
  }

  return {
    summary: `"${title}" by ${author} is a ${categories} textbook available to borrow on SVBBS. Check it out on the shelf — borrow it with your Knowledge Credits and return within 14 days. If the KC cost is more than your balance, you can top up the difference with cash.`,
    source: 'static',
  }
}