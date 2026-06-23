import { env } from './env.js'

export const aiConfig = {
  mock: env.MOCK_AI,
  apiKey: env.GEMINI_API_KEY,
  // Primary model — if quota exhausted (429), chatbotService automatically
  // retries with the fallbackModel before giving up to the smart fallback.
  model: 'gemini-2.0-flash',
  fallbackModel: 'gemini-2.0-flash-lite',
}

if (aiConfig.mock) {
  console.log('[ai] Running in MOCK_AI mode — no Gemini API key required.')
}