import { aiConfig } from '../config/gemini.js'
import Book from '../models/Book.js'
import ChatMessage from '../models/ChatMessage.js'
import KCWallet from '../models/KCWallet.js'
import { BASE_KC, CATEGORY_BONUS } from '../utils/kcRules.js'
import { EXAM_CATEGORIES } from '../data/examCategories.js'

// ─── Gemini API call ────────────────────────────────────────────────────────

async function callGemini(history, systemPrompt, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`

  // Gemini requires alternating user/model roles — filter and fix
  const contents = history
    .filter((m) => m.content?.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  // Ensure it starts with user
  const validContents =
    contents.length > 0 && contents[0].role === 'user'
      ? contents
      : [{ role: 'user', parts: [{ text: 'Hello' }] }]

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: validContents,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.8,
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`Gemini ${res.status}: ${text}`)
    err.status = res.status
    throw err
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned empty response')
  return text
}

// ─── User context for personalised answers ──────────────────────────────────

async function buildUserContext(userId) {
  const [heldBooks, wallet] = await Promise.all([
    Book.find({ currentHolderId: userId, status: 'on_loan' })
      .select('title author dueDate')
      .limit(10),
    KCWallet.findOne({ userId }).select('balance'),
  ])

  const availableBooks = await Book.find({ status: 'available' })
    .select('title author categoryTags kcValue')
    .limit(20)
    .sort({ createdAt: -1 })

  return {
    kcBalance: wallet?.balance ?? 0,
    heldBooks: heldBooks.map((b) => ({
      title: b.title,
      author: b.author,
      dueDate: b.dueDate ? new Date(b.dueDate).toLocaleDateString() : 'no due date',
      overdue: b.dueDate && new Date(b.dueDate) < new Date(),
    })),
    availableBooks: availableBooks.map((b) => ({
      title: b.title,
      author: b.author,
      kcValue: b.kcValue,
      categories: b.categoryTags,
    })),
  }
}

// ─── System prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(ctx) {
  const examList = EXAM_CATEGORIES.map((e) => `${e.code}: ${e.name}`).join(', ')
  const kcRules = Object.entries(BASE_KC).map(([c, v]) => `${c} = ${v} KC`).join(', ')
  const bonuses = Object.entries(CATEGORY_BONUS).map(([k, v]) => `+${v} for ${k}`).join(', ')

  return `You are SVBBS Assistant — an intelligent, friendly AI assistant built into the Smart Vendor Book Bank System (SVBBS), a platform where students deposit, borrow, donate, sell, exchange, and recycle textbooks using Knowledge Credits (KC).

You are like ChatGPT or Gemini — you can answer ANY question on any topic: maths, coding, science, history, general knowledge, career advice, writing help, and more. Always give complete, accurate, helpful answers.

CURRENT USER CONTEXT (use this for personal questions):
- KC Balance: ${ctx.kcBalance} KC
- Books currently borrowed: ${
    ctx.heldBooks.length === 0
      ? 'none'
      : ctx.heldBooks.map((b) => `"${b.title}" by ${b.author} (due ${b.dueDate}${b.overdue ? ' ⚠️ OVERDUE' : ''})`).join(', ')
  }
- Books available to borrow right now: ${
    ctx.availableBooks.length === 0
      ? 'none currently available'
      : ctx.availableBooks.map((b) => `"${b.title}" (${b.kcValue} KC)`).join(', ')
  }

PLATFORM KNOWLEDGE:
- KC earning: ${kcRules}
- Category bonuses: ${bonuses}
- Deposit a book → earn KC instantly
- Borrow → spend KC (+ cash if balance is short), 14-day loan, no late fees
- Donate → book is free for others (0 KC cost to borrow)
- Sell → outright cash sale at your price
- Exchange → swap two books, no KC involved
- Recycle → for poor-condition books
- Waitlist → join when a book is on loan, get notified when available
- Exam Hub categories: ${examList}

RESPONSE STYLE:
- Be conversational, warm, and helpful — like talking to a knowledgeable friend
- For maths/coding: show working step by step with clear explanations
- For general questions: give thorough, accurate answers
- For platform questions: use the live user data above
- Vary your responses — never give the same answer twice
- Use markdown formatting (bold, lists, code blocks) when it helps clarity
- Keep responses focused — detailed when needed, concise when not
- Never say you "can't" answer a general question — you can answer everything`
}

// ─── Smart fallback (when Gemini is unavailable) ────────────────────────────

async function buildSmartFallback(userId, message) {
  const ctx = await buildUserContext(userId)
  const msg = message.toLowerCase()

  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy)/i.test(msg)) {
    const greetings = [
      `Hi there! 👋 I'm your SVBBS assistant. I can help with your KC balance (${ctx.kcBalance} KC), borrowed books, available titles, or any general question. What's on your mind?`,
      `Hello! Great to see you. Your KC balance is ${ctx.kcBalance} KC. How can I help today?`,
      `Hey! I'm here to help with SVBBS or anything else you'd like to ask about. What do you need?`,
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  if (/due|overdue|return|my book|borrowed/i.test(msg)) {
    if (ctx.heldBooks.length === 0)
      return "You don't have any books on loan right now. Browse the Marketplace to find something to borrow!"
    const lines = ctx.heldBooks.map(
      (b) => `• **"${b.title}"** — ${b.overdue ? '⚠️ OVERDUE since' : 'due'} ${b.dueDate}`
    )
    return `Here are your currently borrowed books:\n\n${lines.join('\n')}`
  }

  if (/balance|kc|credit|how much/i.test(msg)) {
    return `Your current KC balance is **${ctx.kcBalance} KC**.\n\nEarn more by depositing books — condition and category both affect the value you receive.`
  }

  if (/available|what.*book|recommend|borrow|shelf/i.test(msg)) {
    if (ctx.availableBooks.length === 0)
      return 'No books are available right now. Check back soon or visit the Marketplace!'
    const list = ctx.availableBooks
      .slice(0, 5)
      .map((b) => `• **"${b.title}"** by ${b.author} — ${b.kcValue} KC`)
      .join('\n')
    return `Here are some books available to borrow right now:\n\n${list}\n\nVisit the Marketplace to see all available books.`
  }

  if (/earn|deposit|how.*kc|condition|worth/i.test(msg)) {
    const bonuses = Object.entries(CATEGORY_BONUS)
      .map(([k, v]) => `+${v} KC for ${k}`)
      .join(', ')
    return `**KC earning rates by condition:**\n\n• Excellent: ${BASE_KC.excellent} KC\n• Good: ${BASE_KC.good} KC\n• Average: ${BASE_KC.average} KC\n• Poor: ${BASE_KC.poor} KC\n\n**Category bonuses (stacked on top):**\n${bonuses}`
  }

  if (/exam|upsc|gate|ssc|cat|banking|railway|defence|appsc|tspsc/i.test(msg)) {
    const list = EXAM_CATEGORIES.map((e) => `• **${e.code}** — ${e.name}`).join('\n')
    return `The Exam Hub covers these government exams:\n\n${list}\n\nVisit /exam-hub to browse books for each category.`
  }

  if (/deposit|donate|sell|exchange|recycle|waitlist/i.test(msg)) {
    return `**How the book flows work:**\n\n• **Deposit** — submit your book, earn KC instantly based on condition + category\n• **Donate** — same but the book is free for others to borrow (0 KC)\n• **Sell** — set a cash price, outright sale\n• **Exchange** — propose a book swap, no KC needed\n• **Borrow** — spend KC (+ cash if short) for a 14-day loan\n• **Recycle** — for poor-condition books that can't be lent`
  }

  // General fallback — honest and helpful
  return `I'm running in offline mode right now, so I'm limited to platform-specific questions.\n\nI can help with:\n• Your KC balance (currently **${ctx.kcBalance} KC**)\n• Borrowed books and due dates\n• Available books to borrow\n• How any platform feature works (deposit, borrow, sell, exchange, etc.)\n• Exam Hub resources\n\nFor general questions like maths, coding, or science — try again in a moment when the AI service is back online!`
}

// ─── Exports ────────────────────────────────────────────────────────────────

export async function getHistory(userId) {
  return ChatMessage.find({ userId }).sort({ createdAt: 1 }).limit(100)
}

export async function sendMessage(userId, message) {
  await ChatMessage.create({ userId, role: 'user', content: message })

  let replyContent = null

  if (!aiConfig.mock && aiConfig.apiKey) {
    const [ctx, recentHistory] = await Promise.all([
      buildUserContext(userId),
      ChatMessage.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
    ])

    const systemPrompt = buildSystemPrompt(ctx)
    const history = recentHistory.reverse()

    // Try primary model, then fallback model on 429
    for (const model of [aiConfig.model, aiConfig.fallbackModel]) {
      try {
        replyContent = await callGemini(history, systemPrompt, model)
        break
      } catch (err) {
        if (err.status === 429) {
          console.warn(`[chatbot] ${model} quota exceeded — trying next model`)
          continue
        }
        console.error(`[chatbot] ${model} error:`, err.message)
        break
      }
    }
  }

  // If Gemini unavailable, use smart fallback
  if (!replyContent) {
    replyContent = await buildSmartFallback(userId, message)
  }

  const reply = await ChatMessage.create({ userId, role: 'assistant', content: replyContent })
  return { reply, mock: !replyContent || aiConfig.mock }
}