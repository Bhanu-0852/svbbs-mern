import * as authService from '../services/authService.js'
import { issueCsrfToken } from '../middleware/csrf.js'
import { refreshTokenMaxAgeMs } from '../utils/token.js'
import { ok, created } from '../utils/response.js'

const REFRESH_COOKIE = 'svbbs_refresh'

// SameSite=lax in dev, none in production (cross-origin Vercel→Render).
// The dedicated CSRF double-submit check on /refresh and /logout is the
// real defence — this is a second layer.
function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: refreshTokenMaxAgeMs(),
    path: '/api/auth',
  })
}

function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' })
}

export async function register(req, res, next) {
  try {
    const result = await authService.register(req.body, req)
    created(res, result)
  } catch (err) {
    next(err)
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const result = await authService.verifyEmail(req.body.otp, req.body.email)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

export async function resendVerification(req, res, next) {
  try {
    const result = await authService.resendVerification(req.body.email)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { accessToken, refreshToken, user } = await authService.login(req.body, req)
    setRefreshCookie(res, refreshToken)
    issueCsrfToken(res)
    ok(res, { accessToken, user })
  } catch (err) {
    if (err.requiresCaptcha) {
      return res.status(400).json({ success: false, message: err.message, requiresCaptcha: true })
    }
    if (err.requiresMfa) {
      return res.status(401).json({ success: false, message: err.message, requiresMfa: true })
    }
    next(err)
  }
}

export async function refresh(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE]
    const { accessToken, refreshToken, user } = await authService.refresh(rawRefreshToken, req)
    setRefreshCookie(res, refreshToken)
    ok(res, { accessToken, user })
  } catch (err) {
    clearRefreshCookie(res)
    next(err)
  }
}

export async function logout(req, res, next) {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE]
    await authService.logout(rawRefreshToken)
    clearRefreshCookie(res)
    ok(res, {}, 'Logged out.')
  } catch (err) {
    next(err)
  }
}

export async function logoutAll(req, res, next) {
  try {
    await authService.logoutAllSessions(req.user._id, 'manual')
    clearRefreshCookie(res)
    ok(res, {}, 'Logged out of all devices.')
  } catch (err) {
    next(err)
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.body.email, req)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

export async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(
      { otp: req.body.otp, email: req.body.email, password: req.body.password },
      req
    )
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

export async function requestLoginOtp(req, res, next) {
  try {
    const result = await authService.requestLoginOtp(req.body.email, req)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

export async function verifyLoginOtp(req, res, next) {
  try {
    const result = await authService.verifyLoginOtp(req.body, req)
    if (result.refreshToken) {
      const { refreshToken, ...rest } = result
      // Use the shared helper — same SameSite/secure settings as every
      // other auth endpoint. The original hand-rolled cookie here had
      // sameSite:'strict' which breaks cross-origin (Vercel→Render).
      setRefreshCookie(res, refreshToken)
      issueCsrfToken(res)
      ok(res, rest)
    } else {
      ok(res, result)
    }
  } catch (err) {
    next(err)
  }
}

export async function me(req, res, next) {
  try {
    ok(res, { user: authService.sanitizeUser(req.user) })
  } catch (err) {
    next(err)
  }
}

export async function getSessions(req, res, next) {
  try {
    const sessions = await authService.listSessions(req.user._id)
    ok(res, { sessions })
  } catch (err) {
    next(err)
  }
}

export async function deleteSession(req, res, next) {
  try {
    await authService.revokeSession(req.user._id, req.params.sessionId)
    ok(res, {}, 'Session revoked.')
  } catch (err) {
    next(err)
  }
}

export async function mfaSetupInit(req, res, next) {
  try {
    const result = await authService.mfaSetupInit(req.user)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

export async function mfaSetupVerify(req, res, next) {
  try {
    const result = await authService.mfaSetupVerify(req.user, req.body.code)
    ok(res, result, 'Two-factor authentication enabled. Save your backup codes now.')
  } catch (err) {
    next(err)
  }
}

export async function mfaDisable(req, res, next) {
  try {
    const result = await authService.mfaDisable(req.user, req.body.code)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}