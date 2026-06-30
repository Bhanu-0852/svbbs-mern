import { env } from './env.js'

let enabled = false
let sentryEndpoint = null
let sentryHeaders = null

/**
 * Lightweight, dependency-free error tracking.
 *
 * The full @sentry/node SDK pulls in OpenTelemetry auto-instrumentation
 * for a dozen libraries this project doesn't use (amqplib, fastify, hapi,
 * …), adding ~19 transitive vulnerability advisories for features we'd
 * never touch. Since all we want is "capture an exception with context
 * and send it to a dashboard", we do exactly that over plain HTTP using
 * Sentry's public Store endpoint — parsed straight from the standard DSN.
 *
 * No DSN set (local dev) → complete no-op, zero overhead.
 */
export function initObservability() {
  if (!env.SENTRY_DSN) {
    console.log('[observability] SENTRY_DSN not set — error tracking disabled.')
    return
  }
  try {
    const dsn = new URL(env.SENTRY_DSN)
    const projectId = dsn.pathname.replace('/', '')
    sentryEndpoint = `${dsn.protocol}//${dsn.host}/api/${projectId}/store/`
    sentryHeaders = {
      'Content-Type': 'application/json',
      'X-Sentry-Auth': [
        'Sentry sentry_version=7',
        `sentry_key=${dsn.username}`,
        'sentry_client=svbbs-lite/1.0',
      ].join(', '),
    }
    enabled = true
    console.log('[observability] Error tracking enabled (lightweight HTTP reporter).')
  } catch (err) {
    console.warn('[observability] Invalid SENTRY_DSN — error tracking disabled:', err.message)
  }
}

/**
 * Reports an error with optional request context. Safe to call whether or
 * not tracking is enabled (no-op if not). Fire-and-forget: a failure to
 * report must never affect the request that's already failing.
 */
export function captureError(err, context = {}) {
  if (!enabled || !sentryEndpoint) return

  const payload = {
    timestamp: new Date().toISOString(),
    platform: 'node',
    level: 'error',
    environment: env.NODE_ENV,
    exception: {
      values: [
        {
          type: err.name || 'Error',
          value: err.message || String(err),
          stacktrace: { frames: parseStack(err.stack) },
        },
      ],
    },
    tags: {
      ...(context.method && context.url ? { route: `${context.method} ${context.url}` } : {}),
      ...(context.status ? { status: String(context.status) } : {}),
    },
    ...(context.userId ? { user: { id: String(context.userId) } } : {}),
  }

  fetch(sentryEndpoint, {
    method: 'POST',
    headers: sentryHeaders,
    body: JSON.stringify(payload),
  }).catch(() => {
    /* reporting failure must not cascade */
  })
}

function parseStack(stack = '') {
  return stack
    .split('\n')
    .slice(1)
    .map((line) => {
      const m = line.match(/at (.+?) \((.+?):(\d+):(\d+)\)/)
      if (!m) return null
      return { function: m[1], filename: m[2], lineno: Number(m[3]), colno: Number(m[4]) }
    })
    .filter(Boolean)
    .reverse()
}