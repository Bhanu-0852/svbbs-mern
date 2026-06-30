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

// ─── Groq API call (free fallback — fast Llama 3.3 70B) ──────────────────────

async function callGroq(history, systemPrompt) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history
      .filter((m) => m.content?.trim())
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
  ]

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${aiConfig.groqKey}`,
    },
    body: JSON.stringify({
      model: aiConfig.groqModel,
      messages,
      max_tokens: 1024,
      temperature: 0.8,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    const err = new Error(`Groq ${res.status}: ${text}`)
    err.status = res.status
    throw err
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Groq returned empty response')
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
  const msg = message.toLowerCase().trim()

  if (/^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|sup|what'?s up)/i.test(msg)) {
    const greetings = [
      `Hi! 👋 I'm your SVBBS assistant. Your KC balance is **${ctx.kcBalance} KC**. I can help with your books, platform features, or any general question — maths, coding, science, anything. What would you like to know?`,
      `Hello! Great to see you. You have **${ctx.kcBalance} KC** in your wallet. Ask me anything — I'm here to help!`,
      `Hey there! 😊 I'm here to help with SVBBS or any topic you have in mind. What's on your mind?`,
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

  if (/balance|my kc|my credit|how many kc|how much kc/i.test(msg)) {
    return `Your KC balance is **${ctx.kcBalance} KC**.\n\nEarn more by depositing books — condition and category both affect the value. Excellent condition books earn the most.`
  }

  if (/available|what.*book|recommend|borrow.*book|can i borrow/i.test(msg)) {
    if (ctx.availableBooks.length === 0)
      return 'No books available right now. Check the Marketplace for the latest listings!'
    const list = ctx.availableBooks
      .slice(0, 5)
      .map((b) => `• **"${b.title}"** by ${b.author} — ${b.kcValue} KC`)
      .join('\n')
    return `Available books right now:\n\n${list}\n\nVisit the Marketplace to see all available books.`
  }

  if (/earn|deposit.*kc|how.*kc.*work|kc.*rule|condition.*worth/i.test(msg)) {
    const bonuses = Object.entries(CATEGORY_BONUS).map(([k, v]) => `+${v} KC for ${k}`).join(', ')
    return `**KC earning rates by condition:**\n\n• Excellent: ${BASE_KC.excellent} KC\n• Good: ${BASE_KC.good} KC\n• Average: ${BASE_KC.average} KC\n• Poor: ${BASE_KC.poor} KC\n\n**Category bonuses (added on top):** ${bonuses}`
  }

  if (/exam|upsc|gate|ssc|cat|banking|railway|defence|appsc|tspsc|ias|ips/i.test(msg)) {
    const list = EXAM_CATEGORIES.map((e) => `• **${e.code}** — ${e.name}`).join('\n')
    return `The Exam Hub covers:\n\n${list}\n\nVisit /exam-hub to browse books for each exam category.`
  }

  if (/how.*deposit|how.*donate|how.*sell|how.*exchange|how.*borrow|how.*recycle|how.*waitlist/i.test(msg)) {
    return `**How the book flows work:**\n\n• **Deposit** → submit your book, earn KC instantly based on condition + category\n• **Donate** → same as deposit but the book is free for others to borrow (0 KC)\n• **Sell** → set a cash price, one-time outright sale\n• **Exchange** → propose a book swap with another student, no KC needed\n• **Borrow** → spend KC (+ cash if short) for a 14-day loan, no late fees\n• **Recycle** → for poor-condition books that can't be lent or sold`
  }

  if (/\b(calculate|solve|what is|compute|find|simplify|\d+\s*[\+\-\*\/\^]\s*\d+)/i.test(msg)) {
    try {
      const expr = msg.replace(/what is|calculate|find|solve|compute/gi, '').replace(/[^0-9+\-*/.() ]/g, '').trim()
      if (expr && expr.length > 0) {
        // eslint-disable-next-line no-new-func
        const result = Function(`"use strict"; return (${expr})`)()
        if (typeof result === 'number' && isFinite(result)) {
          return `**${expr} = ${result}**\n\nNeed help with more complex maths? Ask me any maths question and I'll show the full working!`
        }
      }
    } catch {}
    return `I can help with maths! For complex calculations and step-by-step working, the full AI mode gives the best answers. Try again in a few minutes for detailed maths help, or ask me about SVBBS features in the meantime.`
  }

  if (/\b(code|coding|program|javascript|python|java|react|node|html|css|sql|function|array|loop|bug|error|debug)\b/i.test(msg)) {
    return `I can help with coding! For **"${message}"**:\n\nFor detailed code examples and debugging help, I work best with the full AI mode. Try again in a few minutes for complete coding assistance with examples and explanations!`
  }

  if (/\b(science|physics|chemistry|biology|atom|molecule|force|energy|evolution|cell|dna|gravity|light|sound|electricity)\b/i.test(msg)) {
    return `Great science question about **"${message}"**!\n\nScience topics are best answered with the full AI — detailed explanations with examples. Try again shortly for a comprehensive answer!`
  }

  if (/\b(history|historical|who was|when did|where is|capital of|country|india|world|war|independence|founded|president|king|queen)\b/i.test(msg)) {
    return `Good question! For **"${message}"** — I can answer this thoroughly in full AI mode with detailed context and accuracy. Try again shortly for a comprehensive response!`
  }

  if (/\b(career|job|resume|interview|study|tips|advice|how to learn|skill|salary|placement|mba|engineering)\b/i.test(msg)) {
    return `Career and study advice is one of my strengths! Here are quick tips for **"${message}"**:\n\n• Build real projects to showcase your skills\n• Practice consistently — 1 hour daily compounds significantly\n• For tech: DSA + System Design + one strong tech stack\n• Soft skills matter as much as technical skills\n\nAsk me something specific for a more detailed answer!`
  }

  if (/\b(write|essay|paragraph|letter|email|report|summary|explain|describe)\b/i.test(msg)) {
    return `I can help with writing! For **"${message}"**:\n\nShare more details — topic, length, tone (formal/informal), purpose — and I'll craft something tailored. Writing assistance works best when I know exactly what you need!`
  }

  return `You asked: **"${message}"**\n\nI'm currently in fallback mode (Gemini quota resets daily). I can answer right now:\n\n• Your KC balance (**${ctx.kcBalance} KC**) and borrowed books\n• How depositing, borrowing, selling, and exchanging works\n• Exam Hub resources (UPSC, GATE, SSC, CAT, and more)\n• Any SVBBS platform feature\n\nFor general questions like maths, coding, science, and history — try again in a few minutes when full AI is back!`
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

    if (!replyContent && aiConfig.groqKey) {
      try {
        replyContent = await callGroq(history, systemPrompt)
        console.log('[chatbot] Groq responded')
      } catch (err) {
        console.warn('[chatbot] Groq error:', err.message)
      }
    }
  }

  if (!replyContent) {
    replyContent = await buildSmartFallback(userId, message)
  }

  const reply = await ChatMessage.create({ userId, role: 'assistant', content: replyContent })
  return { reply, mock: false }
}

// ─── Explain a platform feature (for contextual sidebar help) ────────────────

const FEATURE_DESCRIPTIONS = {
  Overview: 'the main dashboard showing wallet balance, borrowed books, and recent activity',
  'Deposit a Book': 'where students submit a book to earn Knowledge Credits, or list it to donate, sell, or exchange',
  'Academic Passport': "a verified record of a student's reading history with a shareable QR code",
  Marketplace: 'the shelf of all available books to borrow with KC or buy with cash',
  'Exam Hub': 'books grouped by government exam — UPSC, GATE, SSC, CAT, Banking, Railways, Defence, APPSC, TSPSC',
  Scholarships: 'where a college admin awards KC grants to their own students',
  'Demand Forecast': 'analytics showing which book categories students borrow most and which books have waitlists',
  'Fraud Detection': 'security signals flagging suspicious logins and unusual transaction patterns for admin review',
  'Sponsor a book': "where a CSR sponsor pays for a specific book on a student's behalf at zero cost to the student",
  'RFID Status': 'physical book tracking — register tags and scan books in/out of the shelf',
  'Revenue Tracking': "the recycler's view of scrap value earned from recycled books",
}

const STATIC_EXPLANATIONS = {
  Overview: 'This is your home dashboard. It shows your Knowledge Credits balance, the books you currently have on loan with their due dates, and a feed of your recent activity. Start here to see everything at a glance.',
  'Deposit a Book': "Use this to add a book to the system. Choose Deposit to earn KC instantly based on the book's condition and category, Donate to make it free for others, Sell for a cash price, or Exchange to swap it for another student's book.",
  'Academic Passport': "Your Academic Passport is a verified record of every book you've borrowed and read. It comes with a shareable QR code, so you can showcase your reading history — great for scholarship or college applications.",
  Marketplace: 'The Marketplace is the shelf of all available books. Borrow any book using your Knowledge Credits — and if your balance is short, top up the difference with cash. You can search, filter by category, or use AI Smart Search.',
  'Exam Hub': 'The Exam Hub groups books by the government exam they help with — UPSC, GATE, SSC, CAT, Banking, Railways, Defence, APPSC, and TSPSC. Click any exam to see its dedicated shelf of preparation books.',
}

export async function explainFeature(featureLabel, userId = null) {
  const known = FEATURE_DESCRIPTIONS[featureLabel]
  const prompt = `In 2-3 friendly sentences, explain the "${featureLabel}" feature of SVBBS (Smart Vendor Book Bank System), a student textbook exchange platform that uses Knowledge Credits (KC).${known ? ` Context: it is ${known}.` : ''} Be concise, warm, and helpful. Address the student directly. No markdown headers.`

  if (!aiConfig.mock && (aiConfig.apiKey || aiConfig.groqKey)) {
    const history = [{ role: 'user', content: prompt }]
    const systemPrompt = 'You are a helpful guide explaining features of the SVBBS textbook platform to students. Keep answers short and clear.'

    if (aiConfig.apiKey) {
      for (const model of [aiConfig.model, aiConfig.fallbackModel]) {
        if (!model) continue
        try {
          return { explanation: await callGemini(history, systemPrompt, model), source: 'ai' }
        } catch (err) {
          if (err.status === 429) continue
          break
        }
      }
    }
    if (aiConfig.groqKey) {
      try {
        return { explanation: await callGroq(history, systemPrompt), source: 'ai' }
      } catch {
        // fall through
      }
    }
  }

  const fallback =
    STATIC_EXPLANATIONS[featureLabel] ||
    `${featureLabel} is one of the features of SVBBS. ${known ? `It's ${known}.` : 'Click it to explore what it offers.'}`
  return { explanation: fallback, source: 'static' }
}