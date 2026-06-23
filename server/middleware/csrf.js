import crypto from 'crypto'

const CSRF_COOKIE = 'svbbs_csrf'

/**
 * Double-submit cookie CSRF protection. Used on routes that rely on the
 * HttpOnly refresh-token cookie (refresh, logout) rather than the
 * Authorization header, since those are the only requests a malicious
 * site could trigger cross-origin using the browser's ambient cookie.
 *
 * Flow: issueCsrfToken sets a *readable* (non-HttpOnly) cookie with a
 * random token. The frontend reads it and sends it back as the
 * X-CSRF-Token header on state-changing requests. A cross-origin
 * attacker can trigger the cookie to be sent, but can't read its value
 * to put in the header — so the two won't match.
 */
export function issueCsrfToken(res) {
  const token = crypto.randomBytes(24).toString('hex')
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  return token
}

export function requireCsrf(req, res, next) {
  const cookieToken = req.cookies?.[CSRF_COOKIE]
  const headerToken = req.headers['x-csrf-token']

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    const err = new Error('CSRF validation failed.')
    err.statusCode = 403
    return next(err)
  }
  next()
}

export const CSRF_COOKIE_NAME = CSRF_COOKIE
