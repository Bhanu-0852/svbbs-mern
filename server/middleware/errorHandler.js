// Per the auth spec (§9.4 / §9.10 of the plan): never leak internal
// details to the client. Full error logged server-side only.
export function errorHandler(err, req, res, next) {
  console.error(`[error] ${req.method} ${req.originalUrl}:`, err)

  const status = err.statusCode || 500
  const message =
    status === 500
      ? 'Something went wrong. Please try again.'
      : err.message || 'Request could not be processed.'

  res.status(status).json({ success: false, message })
}

export function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: 'Route not found.' })
}
