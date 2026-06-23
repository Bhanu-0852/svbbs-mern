import { describe, it, expect } from 'vitest'
import { detectIntent } from '../utils/chatbotIntent.js'

describe('detectIntent', () => {
  it('detects a greeting', () => {
    expect(detectIntent('hello there').intent).toBe('greeting')
    expect(detectIntent('Hi!').intent).toBe('greeting')
  })

  it('detects KC questions', () => {
    expect(detectIntent('how do I earn KC').intent).toBe('kc_rules')
    expect(detectIntent('what are knowledge credits').intent).toBe('kc_rules')
    expect(detectIntent('how many credits do I get').intent).toBe('kc_rules')
  })

  it('detects due/return questions', () => {
    expect(detectIntent('when is my book due').intent).toBe('due_reminder')
    expect(detectIntent('is anything overdue').intent).toBe('due_reminder')
  })

  it('detects an exam question and extracts the exam code', () => {
    const result = detectIntent('do you have books for GATE')
    expect(result.intent).toBe('exam_info')
    expect(result.examCode).toBe('GATE')
  })

  it('detects a generic exam question with no specific code', () => {
    const result = detectIntent('tell me about the exam hub')
    expect(result.intent).toBe('exam_info')
    expect(result.examCode).toBeNull()
  })

  it('detects a how-to question and extracts the action', () => {
    const result = detectIntent('how do I donate a book')
    expect(result.intent).toBe('how_to')
    expect(result.action).toBe('donate')
  })

  it('does not treat a mention of an action alone as how-to without a question phrase', () => {
    const result = detectIntent('I want to sell my book')
    expect(result.intent).not.toBe('how_to')
  })

  it('detects a book recommendation request', () => {
    expect(detectIntent('can you recommend a book').intent).toBe('book_recommendation')
    expect(detectIntent('suggest something for me').intent).toBe('book_recommendation')
  })

  it('extracts a category from a recommendation request when present', () => {
    const result = detectIntent('recommend an engineering book')
    expect(result.intent).toBe('book_recommendation')
    expect(result.category).toBe('engineering')
  })

  it('falls back gracefully for empty or unrecognized input', () => {
    expect(detectIntent('').intent).toBe('fallback')
    expect(detectIntent('   ').intent).toBe('fallback')
    expect(detectIntent('asdkjfh qwoeiur').intent).toBe('fallback')
  })
})
