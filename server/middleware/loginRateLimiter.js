import rateLimit from 'express-rate-limit'

const baseConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please wait before trying again.' },
}

// Per-IP throttle on login attempts (spec §9.2). Account-level lockout
// and progressive delay are handled separately inside authService, since
// those need the specific account's failure history.
export const loginIpLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  limit: 20,
})

export const signupIpLimiter = rateLimit({
  ...baseConfig,
  windowMs: 60 * 60 * 1000,
  limit: 10,
})

export const passwordResetIpLimiter = rateLimit({
  ...baseConfig,
  windowMs: 15 * 60 * 1000,
  limit: 10,
})
