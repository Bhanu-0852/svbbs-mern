import { env } from './env.js'

export const aiConfig = {
  mock: env.MOCK_AI,
  apiKey: env.GEMINI_API_KEY,
  model: 'gemini-2.0-flash-lite',        // higher free quota than flash
  fallbackModel: 'gemini-1.5-flash-latest', // different quota pool
}

if (aiConfig.mock) {
  console.log('[ai] Running in MOCK_AI mode — no Gemini API key required.')
}