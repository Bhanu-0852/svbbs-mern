import { aiConfig } from '../config/gemini.js'

async function callGemini(prompt, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 400, temperature: 0.6 },
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
          content: 'You are a helpful academic book advisor. Answer student questions about whether a book fits their needs, honestly and concisely.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.6,
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response')
  return text.trim()
}

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
    if (aiConfig.apiKey) {
      for (const model of [aiConfig.model, aiConfig.fallbackModel]) {
        if (!model) continue
        try {
          return { answer: await callGemini(prompt, model), source: 'ai' }
        } catch (err) {
          if (err.status === 429) continue
          break
        }
      }
    }
    if (aiConfig.groqKey) {
      try {
        return { answer: await callGroq(prompt), source: 'ai' }
      } catch {
        // fall through
      }
    }
  }

  // Static fallback
  return {
    answer: `"${title}" by ${author} is categorized under ${cats}${examTags.length ? ` and is tagged for ${exams}` : ''}. To decide if it fits your needs, check whether these categories match your subject, and review the condition and description above. You can always borrow it for 14 days and return it if it's not the right fit — no late fees.`,
    source: 'static',
  }
}