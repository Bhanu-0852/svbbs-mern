import { aiConfig } from '../config/gemini.js'
import Book from '../models/Book.js'
import ChatMessage from '../models/ChatMessage.js'
import KCWallet from '../models/KCWallet.js'
import { BASE_KC, CATEGORY_BONUS } from '../utils/kcRules.js'
import { EXAM_CATEGORIES } from '../data/examCategories.js'

// ---------- Real Gemini call ----------

async function callGemini(messages, systemPrompt, modelOverride) {
  const model = modelOverride || aiConfig.model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`

  const contents = messages
    .filter((m) => m.content && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  // Gemini requires alternating user/model turns — ensure we start with user
  const validContents = contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Hello' }] }]

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: validContents,
    generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    const err = new Error(`Gemini API error: ${res.status} — ${errText}`)
    err.status = res.status
    throw err
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null
}

// ---------- Context builder ----------

async function buildUserContext(userId) {
  const [heldBooks, wallet] = await Promise.all([
    Book.find({ currentHolderId: userId, status: 'on_loan' })
      .select('title author dueDate')
      .limit(10),
    KCWallet.findOne({ userId }).select('balance'),
  ])

  const availableBooks = await Book.find({ status: 'available' })
    .select('title author categoryTags examTags kcValue')
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
    examSummary: EXAM_CATEGORIES.map((e) => `${e.code}: ${e.name}`).join(', '),
    kcRules: Object.entries(BASE_KC).map(([c, v]) => `${c}=${v}KC`).join(', '),
    bonusRules: Object.entries(CATEGORY_BONUS).map(([k, v]) => `${k}=+${v}KC`).join(', '),
  }
}

// ---------- System prompt ----------

function buildSystemPrompt(ctx) {
  return `You are the SVBBS Knowledge Bot — an intelligent AI assistant for the Smart Vendor Book Bank System, a platform where students deposit, borrow, donate, sell, exchange, and recycle textbooks using Knowledge Credits (KC).

LIVE USER DATA:
- KC Balance: ${ctx.kcBalance} KC
- Borrowed books: ${
    ctx.heldBooks.length === 0
      ? 'none currently'
      : ctx.heldBooks.map((b) => `"${b.title}" by ${b.author} (due ${b.dueDate}${b.overdue ? ' — OVERDUE' : ''})`).join(', ')
  }
- Available books right now: ${
    ctx.availableBooks.length === 0
      ? 'none available'
      : ctx.availableBooks.map((b) => `"${b.title}" (${b.kcValue}KC)`).join(', ')
  }

PLATFORM RULES:
KC values by condition: ${ctx.kcRules}
Category bonuses: ${ctx.bonusRules}
Exam Hub covers: ${ctx.examSummary}
Loan period: 14 days, no late fees. Waitlist system for books on loan.

YOUR JOB:
Answer EVERY question helpfully — maths problems, science concepts, coding help, general knowledge, history, anything at all. You are a full general-purpose AI that also knows about this platform.
- For maths: show the working step by step
- For coding: give working code with explanation  
- For science/general knowledge: give a clear, accurate answer
- For platform questions: use the live user data above
- Be concise but complete. Never say you can't answer a general question.
- Only use the book list above when recommending books — never invent titles.`
}

// ---------- Smart fallback (used when Gemini quota exhausted) ----------

async function buildSmartFallback(userId, message) {
  const ctx = await buildUserContext(userId)
  const msg = message.toLowerCase().trim()

  // Due dates
  if (/due|overdue|return|borrowed|my book/i.test(msg)) {
    if (ctx.heldBooks.length === 0) return "You don't have any books on loan right now. Head to the Marketplace to borrow something!"
    const lines = ctx.heldBooks.map(
      (b) => `• "${b.title}" — ${b.overdue ? '⚠️ OVERDUE since' : 'due'} ${b.dueDate}`
    )
    return `Your currently borrowed books:\n${lines.join('\n')}`
  }

  // KC balance
  if (/balance|how many kc|kc balance|my credit|my kc/i.test(msg)) {
    return `Your current KC balance is **${ctx.kcBalance} KC**.\n\nEarn more by depositing books — condition and category determine the value.`
  }

  // Available books
  if (/available|what book|recommend|suggest|can i borrow/i.test(msg)) {
    if (ctx.availableBooks.length === 0) return 'No books are available to borrow right now. Check back soon or browse the Marketplace.'
    const list = ctx.availableBooks.slice(0, 5).map((b) => `• "${b.title}" — ${b.kcValue} KC`).join('\n')
    return `Available books right now:\n${list}\n\nBrowse more at /marketplace.`
  }

  // KC rules
  if (/earn|kc rule|knowledge credit|how much kc|condition|deposit worth/i.test(msg)) {
    const bonuses = Object.entries(CATEGORY_BONUS).map(([k, v]) => `+${v} KC for ${k}`).join('\n')
    return `**KC earning rules:**\n• Excellent condition: ${BASE_KC.excellent} KC\n• Good: ${BASE_KC.good} KC\n• Average: ${BASE_KC.average} KC\n• Poor: ${BASE_KC.poor} KC\n\n**Category bonuses:**\n${bonuses}`
  }

  // Exam hub
  if (/exam|upsc|gate|ssc|banking|cat|appsc|tspsc|railway|defence|ias|ips/i.test(msg)) {
    const examList = EXAM_CATEGORIES.map((e) => `• **${e.code}** — ${e.name}`).join('\n')
    return `The Exam Hub covers these exams:\n${examList}\n\nVisit /exam-hub to browse books for each exam.`
  }

  // Platform how-to
  if (/how.*deposit|how.*donate|how.*sell|how.*exchange|how.*borrow|how.*recycle|how.*waitlist/i.test(msg)) {
    return `**How the main flows work:**\n• **Deposit** — submit your book, earn KC instantly based on condition + category\n• **Donate** — same as deposit but the book is free for others (0 KC cost)\n• **Sell** — set a cash price, one-time outright sale\n• **Exchange** — propose a book swap with another student, no KC needed\n• **Borrow** — spend KC (+ cash if your balance is short) for a 14-day loan\n• **Recycle** — for poor-condition books that can't be lent or sold`
  }

  // Maths — basic arithmetic at least
  const mathMatch = msg.match(/^[\d\s\+\-\*\/\(\)\.\^%]+$/)
  if (mathMatch || /calculate|what is \d|solve|\d+\s*[\+\-\*\/]\s*\d/i.test(msg)) {
    try {
      // Safe eval of simple arithmetic
      const expr = msg.replace(/[^0-9+\-*/.() ]/g, '').trim()
      if (expr) {
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${expr})`)()
        if (typeof result === 'number' && isFinite(result)) {
          return `${expr} = **${result}**`
        }
      }
    } catch {
      // Fall through
    }
  }

  // Greeting
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy|sup|what'?s up)/i.test(msg)) {
    return `Hi there! 👋 I'm the SVBBS assistant. I can help you with:\n\n• Your borrowed books and due dates\n• KC balance and earning rules\n• Available books to borrow\n• Exam Hub resources\n• How any platform feature works\n• General questions — maths, science, coding, and more\n\nWhat would you like to know?`
  }

  // General / unknown — honest about current state
  return `I'm doing my best with limited context right now — the AI service is temporarily at capacity, so I'm running on my built-in knowledge.\n\nI can reliably answer questions about:\n• Your KC balance (${ctx.kcBalance} KC) and borrowed books\n• Available books, exam prep resources\n• How depositing, borrowing, selling, and exchanging works\n\nFor general questions like maths or coding, try again in a few minutes when the AI service resets — it will give you a full answer.`
}

// ---------- Exports ----------

export async function getHistory(userId) {
  return ChatMessage.find({ userId }).sort({ createdAt: 1 }).limit(100)
}

export async function sendMessage(userId, message) {
  await ChatMessage.create({ userId, role: 'user', content: message })

  let replyContent = null

  if (!aiConfig.mock && aiConfig.apiKey) {
    // Get recent history for conversation context
    const recentHistory = await ChatMessage.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
    const history = recentHistory.reverse()

    const ctx = await buildUserContext(userId)
    const systemPrompt = buildSystemPrompt(ctx)

    // Try primary model first
    try {
      replyContent = await callGemini(history, systemPrompt)
    } catch (primaryErr) {
      if (primaryErr.status === 429) {
        console.warn(`[chatbot] ${aiConfig.model} quota exceeded — trying ${aiConfig.fallbackModel}`)
        // Try fallback model (different quota pool)
        try {
          replyContent = await callGemini(history, systemPrompt, aiConfig.fallbackModel)
        } catch (fallbackErr) {
          if (fallbackErr.status !== 429) {
            console.error('[chatbot] Fallback model error:', fallbackErr.message)
          } else {
            console.warn('[chatbot] Both models quota exceeded — using smart fallback')
          }
        }
      } else {
        console.error('[chatbot] Gemini error:', primaryErr.message)
      }
    }
  }

  // If Gemini didn't produce a reply (quota exhausted or not configured),
  // use the smart fallback
  if (!replyContent) {
    replyContent = await buildSmartFallback(userId, message)
  }

  const reply = await ChatMessage.create({ userId, role: 'assistant', content: replyContent })
  return { reply, mock: !replyContent || aiConfig.mock }
}