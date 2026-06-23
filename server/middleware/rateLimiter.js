import rateLimit from 'express-rate-limit'

// General API-wide limiter. A stricter, per-IP limiter specifically on
// /auth/login, /register, and password reset (security spec §9.2) lives
// in loginRateLimiter.js — account-level lockout is handled separately
// inside authService since it needs that account's failure history.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
})
