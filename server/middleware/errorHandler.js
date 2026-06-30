import { captureError } from '../config/observability.js'

// Per the auth spec (§9.4 / §9.10 of the plan): never leak internal
// details to the client. Full error logged server-side only.
export function errorHandler(err, req, res, next) {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err)

  const status = err.statusCode || 500

  // Report genuine server faults (5xx) to Sentry with request context.
  // Client errors (4xx — validation, auth, not-found) are expected and
  // would just be noise in an error dashboard, so they're not reported.
  if (status >= 500) {
    captureError(err, {
      method: req.method,
      url: req.originalUrl,
      status,
      userId: req.user?._id,
    })
  }

  const message =
    status === 500
      ? 'Something went wrong. Please try again.'
      : err.message || 'Request could not be processed.'

  res.status(status).json({ success: false, message })
}

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Route not found.' })
}