import { aiConfig } from '../config/gemini.js'
import Book from '../models/Book.js'
import ChatMessage from '../models/ChatMessage.js'
import KCWallet from '../models/KCWallet.js'
import { BASE_KC, CATEGORY_BONUS } from '../utils/kcRules.js'
import { EXAM_CATEGORIES } from '../data/examCategories.js'

// ─── Gemini API call ──────────────────────────────────────────────────────────

async function callGemini(history, systemPrompt, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`

  const contents = history
    .filter((m) => m.content?.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const validContents =
    contents.length > 0 && contents[0].role === 'user'
      ? contents
      : [{ role: 'user', parts: [{ text: 'Hello' }] }]

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: validContents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.8 },
    }),
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

// ─── User context ─────────────────────────────────────────────────────────────

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
    })),
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(ctx) {
  const examList = EXAM_CATEGORIES.map((e) => `${e.code}: ${e.name}`).join(', ')
  const kcRules = Object.entries(BASE_KC).map(([c, v]) => `${c} = ${v} KC`).join(', ')
  const bonuses = Object.entries(CATEGORY_BONUS).map(([k, v]) => `+${v} for ${k}`).join(', ')

  return `You are SVBBS Assistant — a smart, friendly AI assistant built into the Smart Vendor Book Bank System, a platform where students deposit, borrow, donate, sell, and exchange textbooks using Knowledge Credits (KC).

You are a general-purpose AI like ChatGPT or Gemini. Answer ANY question on any topic — maths, coding, science, history, writing, career advice, general knowledge, and more. Always give complete, accurate, helpful answers.

LIVE USER DATA:
- KC Balance: ${ctx.kcBalance} KC
- Currently borrowed: ${ctx.heldBooks.length === 0 ? 'nothing' : ctx.heldBooks.map((b) => `"${b.title}" (due ${b.dueDate}${b.overdue ? ' OVERDUE' : ''})`).join(', ')}
- Available to borrow: ${ctx.availableBooks.length === 0 ? 'none right now' : ctx.availableBooks.map((b) => `"${b.title}" — ${b.kcValue} KC`).join(', ')}

PLATFORM RULES:
- KC rates: ${kcRules}
- Category bonuses: ${bonuses}
- Deposit = earn KC instantly. Donate = book free for others. Sell = cash. Exchange = swap books.
- Borrow = spend KC + cash if short, 14-day loan, no late fees. Recycle = poor-condition books.
- Exam Hub categories: ${examList}

RESPONSE STYLE:
- Be conversational, warm, and helpful like a knowledgeable friend
- For maths/coding: show full working step by step
- For general questions: give thorough, accurate answers
- For platform questions: use the live user data above
- Use markdown formatting (bold, lists, code blocks) when it helps
- Never refuse to answer any reasonable question
- Vary your responses — never repeat the same phrasing`
}

// ─── Smart fallback (when Gemini quota exhausted) ─────────────────────────────

async function buildSmartFallback(userId, message) {
  const ctx = await buildUserContext(userId)
  const msg = message.toLowerCase()

  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy)/i.test(msg)) {
    const greetings = [
      `Hi! 👋 I'm your SVBBS assistant. Your KC balance is **${ctx.kcBalance} KC**. Ask me about your books, platform features, or anything else!`,
      `Hello! Great to see you. You have **${ctx.kcBalance} KC** in your wallet. How can I help?`,
      `Hey there! I'm here to help with SVBBS or any question you have. What's on your mind?`,
    ]
    return greetings[Math.floor(Math.random() * greetings.length)]
  }

  if (/due|overdue|return|my book|borrowed/i.test(msg)) {
    if (ctx.heldBooks.length === 0)
      return "You don't have any books on loan right now. Browse the Marketplace to find something to borrow!"
    const lines = ctx.heldBooks.map(
      (b) => `• **"${b.title}"** — ${b.overdue ? '⚠️ OVERDUE since' : 'due'} ${b.dueDate}`
    )
    return `Your currently borrowed books:\n\n${lines.join('\n')}`
  }

  if (/balance|kc|credit|how much/i.test(msg)) {
    return `Your KC balance is **${ctx.kcBalance} KC**.\n\nEarn more by depositing books — condition and category both affect the value.`
  }

  if (/available|what.*book|recommend|borrow.*book/i.test(msg)) {
    if (ctx.availableBooks.length === 0)
      return 'No books available right now. Check the Marketplace for the latest listings!'
    const list = ctx.availableBooks
      .slice(0, 5)
      .map((b) => `• **"${b.title}"** by ${b.author} — ${b.kcValue} KC`)
      .join('\n')
    return `Available books right now:\n\n${list}\n\nVisit the Marketplace to see all available books.`
  }

  if (/earn|deposit|how.*kc|condition|worth/i.test(msg)) {
    const bonuses = Object.entries(CATEGORY_BONUS).map(([k, v]) => `+${v} KC for ${k}`).join(', ')
    return `**KC earning rates:**\n\n• Excellent: ${BASE_KC.excellent} KC\n• Good: ${BASE_KC.good} KC\n• Average: ${BASE_KC.average} KC\n• Poor: ${BASE_KC.poor} KC\n\n**Bonuses:** ${bonuses}`
  }

  if (/exam|upsc|gate|ssc|cat|banking|railway|defence|appsc|tspsc/i.test(msg)) {
    const list = EXAM_CATEGORIES.map((e) => `• **${e.code}** — ${e.name}`).join('\n')
    return `The Exam Hub covers:\n\n${list}\n\nVisit /exam-hub to browse books for each exam.`
  }

  if (/deposit|donate|sell|exchange|recycle|waitlist/i.test(msg)) {
    return `**Book flows:**\n\n• **Deposit** → earn KC instantly\n• **Donate** → book becomes free for others\n• **Sell** → cash sale at your price\n• **Exchange** → swap with another student\n• **Borrow** → spend KC, 14-day loan\n• **Recycle** → for poor-condition books`
  }

  return `I'm running on my built-in knowledge right now (AI quota temporarily at capacity). I can answer:\n\n• Your KC balance (**${ctx.kcBalance} KC**) and borrowed books\n• How depositing, borrowing, selling, exchanging works\n• Exam Hub resources\n\nFor general questions like maths or coding — try again in a few minutes when full AI is back!`
}

// ─── Exports ──────────────────────────────────────────────────────────────────

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

    for (const model of [aiConfig.model, aiConfig.fallbackModel]) {
      if (!model) continue
      try {
        replyContent = await callGemini(history, systemPrompt, model)
        console.log(`[chatbot] ${model} responded`)
        break
      } catch (err) {
        if (err.status === 429) {
          console.warn(`[chatbot] ${model} quota exceeded — trying next`)
          continue
        }
        console.error(`[chatbot] ${model} error:`, err.message)
        break
      }
    }
  }

  if (!replyContent) {
    replyContent = await buildSmartFallback(userId, message)
  }

  const reply = await ChatMessage.create({ userId, role: 'assistant', content: replyContent })
  return { reply, mock: false }
}