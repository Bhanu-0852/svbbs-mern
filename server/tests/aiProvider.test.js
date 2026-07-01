import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The provider layer reads aiConfig at module load, so we mock the config
// module to control mock-mode and key presence per test. This lets us test
// the real guard logic (mock mode, no-provider) without any network calls.
vi.mock('../config/gemini.js', () => ({
  aiConfig: {
    mock: false,
    apiKey: '',
    model: 'gemini-2.0-flash',
    fallbackModel: 'gemini-2.0-flash-lite',
    groqKey: '',
    groqModel: 'llama-3.3-70b-versatile',
  },
}))

import { aiConfig } from '../config/gemini.js'
import { generate, generateJson, listProviders } from '../services/ai/aiProvider.js'

describe('aiProvider — guard paths (no network)', () => {
  beforeEach(() => {
    aiConfig.mock = false
    aiConfig.apiKey = ''
    aiConfig.groqKey = ''
  })

  it('throws AI_MOCK when mock mode is on, before any provider is tried', async () => {
    aiConfig.mock = true
    await expect(
      generate({ messages: [{ role: 'user', content: 'hi' }] })
    ).rejects.toMatchObject({ code: 'AI_MOCK' })
  })

  it('throws AI_UNAVAILABLE when no provider has credentials', async () => {
    aiConfig.mock = false
    // both keys empty → no provider is available()
    await expect(
      generate({ messages: [{ role: 'user', content: 'hi' }] })
    ).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' })
  })
})

describe('aiProvider — listProviders reflects configured keys', () => {
  beforeEach(() => {
    aiConfig.apiKey = ''
    aiConfig.groqKey = ''
  })

  it('reports gemini available only when an API key is present', () => {
    aiConfig.apiKey = 'test-key'
    const gemini = listProviders().find((p) => p.name === 'gemini')
    expect(gemini.available).toBe(true)
  })

  it('reports groq available only when a groq key is present', () => {
    aiConfig.groqKey = 'test-groq'
    const groq = listProviders().find((p) => p.name === 'groq')
    expect(groq.available).toBe(true)
  })

  it('reports both unavailable when no keys are set', () => {
    const providers = listProviders()
    expect(providers.every((p) => p.available === false)).toBe(true)
  })
})

describe('aiProvider — generateJson parsing', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('strips markdown fences and parses JSON from a provider reply', async () => {
    aiConfig.mock = false
    aiConfig.groqKey = 'test-groq'

    // Mock fetch to return a Groq-shaped response wrapping fenced JSON.
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '```json\n{"summary":"hi","skills":["a"]}\n```' } }],
      }),
    })

    const { data } = await generateJson({ messages: [{ role: 'user', content: 'x' }] })
    expect(data).toEqual({ summary: 'hi', skills: ['a'] })
    vi.restoreAllMocks()
  })
})