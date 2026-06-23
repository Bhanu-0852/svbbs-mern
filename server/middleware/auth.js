import { verifyAccessToken } from '../utils/token.js'
import { fail } from '../utils/response.js'
import User from '../models/User.js'

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) throw fail(401, 'Authentication required.')

    let payload
    try {
      payload = verifyAccessToken(token)
    } catch {
      throw fail(401, 'Session expired or invalid. Please log in again.')
    }

    const user = await User.findById(payload.sub).select('-passwordHash')
    if (!user || !user.isActive) {
      throw fail(401, 'Account no longer accessible.')
    }

    req.user = user // full doc (minus password) for ownership checks downstream
    req.auth = { userId: user._id.toString(), role: user.role }
    next()
  } catch (err) {
    next(err)
  }
}

// Attaches req.user if a valid token is present, but never blocks the
// request — used on routes that behave differently for logged-in vs
// anonymous users without requiring login.
export async function attachUserIfPresent(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return next()

    const payload = verifyAccessToken(token)
    const user = await User.findById(payload.sub).select('-passwordHash')
    if (user && user.isActive) {
      req.user = user
      req.auth = { userId: user._id.toString(), role: user.role }
    }
    next()
  } catch {
    next() // invalid/expired token on an optional route — just proceed as anonymous
  }
}
