import { describe, it, expect, vi } from 'vitest'
import { initObservability, captureError } from '../config/observability.js'

describe('observability — safe no-op when disabled', () => {
  it('initObservability does not throw when SENTRY_DSN is unset', () => {
    expect(() => initObservability()).not.toThrow()
  })

  it('captureError is a silent no-op when tracking is disabled', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    expect(() => captureError(new Error('boom'), { method: 'GET', url: '/x' })).not.toThrow()
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('captureError tolerates a missing/empty error object', () => {
    expect(() => captureError(undefined)).not.toThrow()
    expect(() => captureError({})).not.toThrow()
  })
})