import { aiConfig } from '../config/gemini.js'

async function callGemini(prompt, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 300, temperature: 0.6 },
    }),
  })
  if (!res.ok) {
    const err = new Error(`Gemini ${res.status}`)
    err.status = res.status
    throw err
  }
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response')
  return text.trim()
}

async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiConfig.groqKey}`,
    },
    body: JSON.stringify({
      model: aiConfig.groqModel,
      messages: [
        {
          role: 'system',
          content: 'You are a knowledgeable book advisor. Write concise, helpful book summaries for students.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 300,
      temperature: 0.6,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response')
  return text.trim()
}

export async function generateBookSummary({ title, author, categoryTags = [], description = '' }) {
  const categories = categoryTags.join(', ') || 'general'
  const existingDesc = description ? `The platform description says: "${description}". ` : ''

  const prompt = `${existingDesc}Write a helpful 3-4 sentence summary of the book "${title}" by ${author} (categories: ${categories}). Cover: what the book is about, what topics it covers, and who would benefit most from reading it. Write directly and clearly for a student deciding whether to borrow it.`

  if (!aiConfig.mock) {
    if (aiConfig.apiKey) {
      for (const model of [aiConfig.model, aiConfig.fallbackModel]) {
        if (!model) continue
        try {
          const text = await callGemini(prompt, model)
          return { summary: text, source: 'ai' }
        } catch (err) {
          if (err.status === 429) continue
          break
        }
      }
    }

    if (aiConfig.groqKey) {
      try {
        const text = await callGroq(prompt)
        return { summary: text, source: 'ai' }
      } catch {
        // fall through
      }
    }
  }

  return {
    summary: `"${title}" by ${author} is a ${categories} textbook available to borrow on SVBBS. Check it out on the shelf — borrow it with your Knowledge Credits and return within 14 days. If the KC cost is more than your balance, you can top up the difference with cash.`,
    source: 'static',
  }
}