import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) // throws on invalid/expired
}

// The refresh token itself is a signed JWT carrying only the session's
// tokenFamilyId — the actual trust boundary is the Session document in
// Mongo (hash match + revoked flag + expiry), not the JWT alone.
export function signRefreshToken(userId, tokenFamilyId) {
  return jwt.sign(
    { sub: userId.toString(), fam: tokenFamilyId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  )
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET)
}

export function refreshTokenMaxAgeMs() {
  return 7 * 24 * 60 * 60 * 1000 // 7 days, matches JWT_REFRESH_EXPIRES_IN
}
