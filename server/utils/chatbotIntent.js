const EXAM_CODES = ['UPSC', 'SSC', 'BANKING', 'RAILWAYS', 'DEFENCE', 'APPSC', 'TSPSC', 'GATE', 'CAT']
const CATEGORIES = ['engineering', 'medical', 'government_exam', 'rare', 'arts', 'science', 'general']
const HOW_TO_ACTIONS = ['deposit', 'donate', 'sell', 'exchange', 'borrow', 'recycle', 'waitlist', 'reserve']

/**
 * Plain keyword/substring matching, not a trained model — the same
 * honesty framing already used for recommendationService.js ("simple
 * ranking, not AI"). Returns an intent + whatever entity (exam code,
 * category, action) was found in the text, so chatbotService.js can go
 * fetch real data to ground the reply rather than returning canned text.
 * Pure and side-effect-free on purpose, so it's directly testable
 * without a database.
 */
export function detectIntent(rawMessage) {
  const message = (rawMessage || '').toLowerCase().trim()

  if (!message) {
    return { intent: 'fallback' }
  }

  if (/\b(hi|hello|hey|good morning|good afternoon)\b/.test(message)) {
    return { intent: 'greeting' }
  }

  if (/\b(kc|knowledge credit|credits?|reward|earn)\b/.test(message)) {
    return { intent: 'kc_rules' }
  }

  if (/\b(due|overdue|return my|when.*return|return date)\b/.test(message)) {
    return { intent: 'due_reminder' }
  }

  const mentionedExam = EXAM_CODES.find((code) => message.includes(code.toLowerCase()))
  if (mentionedExam || /\bexam\b/.test(message)) {
    return { intent: 'exam_info', examCode: mentionedExam || null }
  }

  const mentionedAction = HOW_TO_ACTIONS.find((action) => message.includes(action))
  if (mentionedAction && /\b(how|what is|explain)\b/.test(message)) {
    return { intent: 'how_to', action: mentionedAction }
  }

  if (/\b(recommend|suggest|what should i read|looking for)\b/.test(message)) {
    const mentionedCategory = CATEGORIES.find((cat) => message.includes(cat.replace('_', ' ')))
    return { intent: 'book_recommendation', category: mentionedCategory || null }
  }

  return { intent: 'fallback' }
}
