import { env } from './env.js'

// AI config for the chatbot and book verification.
// MOCK_AI defaults to true so the app runs without any paid key.
// Chatbot uses a cascade: Gemini (free) → Groq (free) → smart fallback.
export const aiConfig = {
  mock: env.MOCK_AI,

  // Gemini (Google) — primary, free tier
  apiKey: env.GEMINI_API_KEY,
  model: 'gemini-2.0-flash',
  fallbackModel: 'gemini-2.0-flash-lite',

  // Groq — secondary fallback, free tier, very fast Llama inference
  groqKey: env.GROQ_API_KEY,
  groqModel: 'llama-3.3-70b-versatile',
}

if (aiConfig.mock) {
  console.log('[ai] Running in MOCK_AI mode — no Gemini API key required.')
}