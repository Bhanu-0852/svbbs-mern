import { aiConfig } from '../../config/gemini.js'

/**
 * ─── AI Provider Abstraction Layer ──────────────────────────────────────────
 *
 * A single, swappable interface over every AI backend. Each provider
 * implements the same `complete({ system, messages, json })` contract, so
 * the rest of the app never knows or cares which model answered.
 *
 * This is the Strategy pattern: callers depend on the abstract `generate()`
 * function, not on any concrete provider. Adding a new backend (Claude, GPT,
 * Llama, DeepSeek, a local Ollama model) means writing one adapter that
 * satisfies the contract and registering it — zero changes to any feature.
 *
 * The `generate()` entry point runs providers as an ordered cascade: it tries
 * each enabled provider in priority order and returns the first success, so a
 * quota limit or outage on one backend transparently falls through to the
 * next.
 */

const geminiProvider = {
  name: 'gemini',
  models: [aiConfig.model, aiConfig.fallbackModel].filter(Boolean),
  available: () => Boolean(aiConfig.apiKey),

  async complete({ system, messages, json, maxTokens = 1024, temperature = 0.7 }) {
    const contents = messages
      .filter((m) => m.content?.trim())
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const validContents =
      contents.length && contents[0].role === 'user'
        ? contents
        : [{ role: 'user', parts: [{ text: 'Hello' }] }]

    const body = {
      contents: validContents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    }
    if (system) body.system_instruction = { parts: [{ text: system }] }

    let lastErr
    for (const model of this.models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${aiConfig.apiKey}`
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = new Error(`Gemini ${res.status}: ${await res.text()}`)
          err.status = res.status
          if (res.status === 429) {
            lastErr = err
            continue
          }
          throw err
        }
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) throw new Error('Gemini returned empty response')
        return { text: text.trim(), provider: this.name, model }
      } catch (err) {
        lastErr = err
        if (err.status && err.status !== 429) break
      }
    }
    throw lastErr || new Error('Gemini unavailable')
  },
}

const groqProvider = {
  name: 'groq',
  model: aiConfig.groqModel,
  available: () => Boolean(aiConfig.groqKey),

  async complete({ system, messages, json, maxTokens = 1024, temperature = 0.7 }) {
    const chat = [
      ...(system ? [{ role: 'system', content: system }] : []),
      ...messages
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
        model: this.model,
        messages: chat,
        max_tokens: maxTokens,
        temperature,
        // Groq's API is OpenAI-compatible and supports forced JSON mode —
        // wired in because generateJson() has real callers (search query
        // parsing, career roadmap generation) that can fail through to
        // Groq, and an unstructured Groq reply would otherwise break
        // JSON.parse() downstream.
        ...(json ? { response_format: { type: 'json_object' } } : {}),
      }),
    })
    if (!res.ok) {
      const err = new Error(`Groq ${res.status}: ${await res.text()}`)
      err.status = res.status
      throw err
    }
    const data = await res.json()
    const text = data.choices?.[0]?.message?.content
    if (!text) throw new Error('Groq returned empty response')
    return { text: text.trim(), provider: this.name, model: this.model }
  },
}

const PROVIDERS = [geminiProvider, groqProvider]

export async function generate(opts) {
  if (aiConfig.mock) {
    const err = new Error('AI is in mock mode (MOCK_AI=true)')
    err.code = 'AI_MOCK'
    throw err
  }

  const enabled = PROVIDERS.filter((p) => p.available())
  if (!enabled.length) {
    const err = new Error('No AI provider is configured')
    err.code = 'AI_UNAVAILABLE'
    throw err
  }

  let lastErr
  for (const provider of enabled) {
    try {
      return await provider.complete(opts)
    } catch (err) {
      console.warn(`[ai] ${provider.name} failed: ${err.message} — trying next provider`)
      lastErr = err
    }
  }
  throw lastErr || new Error('All AI providers failed')
}

export async function generateJson(opts) {
  const { text, provider, model } = await generate({ ...opts, json: true })
  const clean = text.replace(/```json|```/g, '').trim()
  return { data: JSON.parse(clean), provider, model }
}

export function listProviders() {
  return PROVIDERS.map((p) => ({ name: p.name, available: p.available() }))
}