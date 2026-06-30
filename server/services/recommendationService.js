import { aiConfig } from '../config/gemini.js'
import Book from '../models/Book.js'
import Transaction from '../models/Transaction.js'
import { topCategoriesByFrequency, rankByCategoryOverlap } from '../utils/recommendationRanking.js'

const RECOMMENDATION_LIMIT = 6

const CATEGORY_LABELS = {
  engineering: 'Engineering',
  medical: 'Medical',
  government_exam: 'Government Exams',
  rare: 'Rare Books',
  arts: 'Arts & Humanities',
  science: 'Science',
  general: 'General',
}

async function generateAiInsight(topCategories, borrowedTitles, recommendedTitles) {
  const categoryNames = topCategories.map((c) => CATEGORY_LABELS[c] || c).join(', ')
  const borrowedList = borrowedTitles.slice(0, 5).join(', ') || 'none yet'
  const recommendedList = recommendedTitles.slice(0, 4).join(', ')

  const prompt = `A student on the SVBBS textbook platform has the following reading profile:
- Most borrowed categories: ${categoryNames}
- Books they've read: ${borrowedList}
- Books now recommended for them: ${recommendedList}

Write 2 warm, friendly sentences directly to the student explaining why these books were chosen for them. Be specific about their interests. Start with "Based on your reading..." or similar. No markdown, no bullet points.`

  const history = [{ role: 'user', content: prompt }]
  const systemPrompt = 'You are a friendly reading advisor for a student textbook platform. Write short, warm, personalized recommendations.'

  if (aiConfig.apiKey) {
    for (const model of [aiConfig.model, aiConfig.fallbackModel]) {
      if (!model) continue
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: history.map((m) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
            generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
          }),
        })
        if (!res.ok) {
          const err = new Error(`Gemini ${res.status}`)
          err.status = res.status
          throw err
        }
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) return { insight: text.trim(), source: 'ai' }
      } catch (err) {
        if (err.status === 429) continue
        break
      }
    }
  }

  if (aiConfig.groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${aiConfig.groqKey}`,
        },
        body: JSON.stringify({
          model: aiConfig.groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content
        if (text) return { insight: text.trim(), source: 'ai' }
      }
    } catch {
      // fall through
    }
  }

  const fallbacks = [
    `Based on your interest in ${categoryNames}, these picks align perfectly with your reading journey so far. Each one builds on what you've already explored and opens new doors in your favourite subjects.`,
    `Your reading history in ${categoryNames} shows a great appetite for learning! These books were chosen because they complement what you've already borrowed and will deepen your knowledge further.`,
    `Since you've been exploring ${categoryNames}, I picked books that match your curiosity and fill in the gaps. Happy reading!`,
  ]
  return {
    insight: fallbacks[Math.floor(Math.random() * fallbacks.length)],
    source: 'static',
  }
}

export async function getRecommendations(userId) {
  const transactions = await Transaction.find({ userId, type: 'borrow' }).populate(
    'bookId',
    'categoryTags title'
  )

  const borrowedBookIds = new Set(
    transactions.filter((t) => t.bookId).map((t) => t.bookId._id.toString())
  )

  const borrowedTitles = transactions
    .filter((t) => t.bookId?.title)
    .map((t) => t.bookId.title)
    .slice(0, 10)

  const categoryCounts = {}
  transactions.forEach((t) => {
    ;(t.bookId?.categoryTags || []).forEach((tag) => {
      categoryCounts[tag] = (categoryCounts[tag] || 0) + 1
    })
  })

  const topCategories = topCategoriesByFrequency(categoryCounts, 3)

  if (topCategories.length === 0) {
    const books = await Book.find({ status: 'available' })
      .sort({ createdAt: -1 })
      .limit(RECOMMENDATION_LIMIT)

    return {
      basis: 'cold_start',
      recommendations: books.map((book) => ({ book, matchedCategories: [] })),
      aiInsight: null,
    }
  }

  const candidates = await Book.find({
    status: 'available',
    categoryTags: { $in: topCategories },
    _id: { $nin: [...borrowedBookIds] },
  })
    .sort({ createdAt: -1 })
    .limit(RECOMMENDATION_LIMIT * 3)

  const ranked = rankByCategoryOverlap(candidates, topCategories).slice(0, RECOMMENDATION_LIMIT)
  const recommendedTitles = ranked.map((r) => r.book.title)

  let aiInsight = null
  if (!aiConfig.mock) {
    try {
      aiInsight = await generateAiInsight(topCategories, borrowedTitles, recommendedTitles)
    } catch {
      aiInsight = null
    }
  }

  return { basis: 'borrow_history', recommendations: ranked, aiInsight }
}