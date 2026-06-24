import { Router } from 'express'

import * as authController from '../controllers/authController.js'
import { validate } from '../middleware/validate.js'
import { requireAuth } from '../middleware/auth.js'
import { requireCsrf } from '../middleware/csrf.js'
import { loginIpLimiter, signupIpLimiter, passwordResetIpLimiter } from '../middleware/loginRateLimiter.js'

import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  mfaVerifySchema,
  requestEmailOtpSchema,
  verifyEmailOtpLoginSchema,
} from '../validators/authValidators.js'

const router = Router()

// ---- Public ----
router.post('/register', signupIpLimiter, validate(registerSchema), authController.register)
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail)
router.post('/resend-verification', signupIpLimiter, authController.resendVerification)

router.post('/login', loginIpLimiter, validate(loginSchema), authController.login)
router.post('/login/request-otp', passwordResetIpLimiter, validate(requestEmailOtpSchema), authController.requestLoginOtp)
router.post('/login/verify-otp', passwordResetIpLimiter, validate(verifyEmailOtpLoginSchema), authController.verifyLoginOtp)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)

router.post('/forgot-password', passwordResetIpLimiter, validate(forgotPasswordSchema), authController.forgotPassword)
router.post('/reset-password', passwordResetIpLimiter, validate(resetPasswordSchema), authController.resetPassword)

// ---- Protected (requires a valid access token) ----
router.get('/me', requireAuth, authController.me)
router.post('/logout-all', requireAuth, requireCsrf, authController.logoutAll)

router.get('/sessions', requireAuth, authController.getSessions)
router.delete('/sessions/:sessionId', requireAuth, authController.deleteSession)

router.post('/mfa/setup', requireAuth, authController.mfaSetupInit)
router.post('/mfa/verify', requireAuth, validate(mfaVerifySchema), authController.mfaSetupVerify)
router.post('/mfa/disable', requireAuth, validate(mfaVerifySchema), authController.mfaDisable)

export default router
