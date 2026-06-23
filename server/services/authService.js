import crypto from 'crypto'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

import User from '../models/User.js'
import Session from '../models/Session.js'
import MFA from '../models/MFA.js'
import LoginAttempt from '../models/LoginAttempt.js'

import { hashPassword, comparePassword, compareAgainstDummy } from '../utils/hash.js'
import { validatePasswordPolicy, isPasswordBreached } from '../utils/password.js'
import { encrypt, decrypt, hashToken, generateRawToken } from '../utils/crypto.js'
import { signAccessToken, signRefreshToken, verifyRefreshToken, refreshTokenMaxAgeMs } from '../utils/token.js'
import { fail, GENERIC } from '../utils/response.js'
import { sendMail } from '../config/mailer.js'
import { env } from '../config/env.js'
import { logAudit } from './auditService.js'

const FAILED_ATTEMPTS_BEFORE_CAPTCHA = 3
const FAILED_ATTEMPTS_BEFORE_LOCKOUT = 5
const OTP_TTL_MS = 10 * 60 * 1000
const VERIFICATION_TOKEN_TTL_MS = OTP_TTL_MS
const RESET_TOKEN_TTL_MS = OTP_TTL_MS
const LOGIN_OTP_TTL_MS = OTP_TTL_MS
const BACKUP_CODE_COUNT = 8

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    mfaEnabled: user.mfaEnabled,
    collegeVerified: user.collegeVerified,
    kcWalletId: user.kcWalletId,
    badges: user.badges,
  }
}

async function recordAttempt({ email, ip, success, reason, userAgent }) {
  try {
    await LoginAttempt.create({ email, ip, success, reason, userAgent })
  } catch (err) {
    console.error('[auth] Failed to record login attempt:', err.message)
  }
}

// ---------- Registration & email verification ----------

export async function register({ name, email, password, role }, req) {
  const policyError = validatePasswordPolicy(password)
  if (policyError) throw fail(400, policyError)

  if (await isPasswordBreached(password)) {
    throw fail(400, 'That password has appeared in a known data breach. Please choose a different one.')
  }

  const existing = await User.findOne({ email })

  if (existing) {
    if (!existing.isVerified) {
      // Unverified account — regenerate OTP and let them continue
      const otp = generateOtp()
      existing.emailVerificationTokenHash = hashToken(otp)
      existing.emailVerificationExpires = new Date(Date.now() + OTP_TTL_MS)
      await existing.save()

      const devOtp = (env.NODE_ENV !== 'production' && !env.SMTP_HOST) ? otp : null
      if (devOtp) {
        console.log(`\n[auth] Dev OTP for ${email}: ${devOtp}\n`)
      } else {
        await sendMail({
          to: email,
          subject: 'Your SVBBS verification code',
          html: `<p>Your verification code is: <strong style="font-size:24px;letter-spacing:4px">${otp}</strong></p><p>Expires in 10 minutes.</p>`,
        })
      }
      return { message: GENERIC.CHECK_INBOX, devOtp, email }
    }
    // Already verified — tell the frontend to redirect to login instead
    // of silently doing nothing, which left users confused.
    return { message: GENERIC.CHECK_INBOX, alreadyExists: true }
  }

  const passwordHash = await hashPassword(password)
  const otp = generateOtp()

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role || 'student',
    isVerified: false,
    emailVerificationTokenHash: hashToken(otp),
    emailVerificationExpires: new Date(Date.now() + OTP_TTL_MS),
  })

  const devOtp = (env.NODE_ENV !== 'production' && !env.SMTP_HOST) ? otp : null

  if (devOtp) {
    console.log(`\n[auth] Dev OTP for ${email}: ${devOtp}\n`)
  } else {
    await sendMail({
      to: email,
      subject: 'Your SVBBS verification code',
      html: `<p>Hi ${name},</p><p>Your verification code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center">${otp}</p><p>Expires in 10 minutes. If you didn't create an account, ignore this.</p>`,
    })
  }

  await logAudit({ actorId: user._id, action: 'auth.register', req })

  return { message: GENERIC.CHECK_INBOX, devOtp, email }
}

export async function verifyEmail(otp, email) {
  const user = await User.findOne({
    email,
    emailVerificationExpires: { $gt: new Date() },
  })

  if (!user || user.emailVerificationTokenHash !== hashToken(otp)) {
    throw fail(400, 'Invalid or expired code. Please check the code and try again.')
  }

  user.isVerified = true
  user.emailVerificationTokenHash = null
  user.emailVerificationExpires = null
  await user.save()

  await logAudit({ actorId: user._id, action: 'auth.email_verified' })

  return { message: 'Email verified. You can now log in.' }
}

export async function resendVerification(email) {
  const user = await User.findOne({ email })

  if (user && !user.isVerified) {
    const otp = generateOtp()
    user.emailVerificationTokenHash = hashToken(otp)
    user.emailVerificationExpires = new Date(Date.now() + OTP_TTL_MS)
    await user.save()

    const devOtp = (env.NODE_ENV !== 'production' && !env.SMTP_HOST) ? otp : null
    if (devOtp) {
      console.log(`\n[auth] Resend OTP for ${email}: ${devOtp}\n`)
    } else {
      await sendMail({
        to: email,
        subject: 'Your SVBBS verification code',
        html: `<p>Your new verification code is: <strong style="font-size:24px;letter-spacing:4px">${otp}</strong></p><p>Expires in 10 minutes.</p>`,
      })
    }
    return { message: GENERIC.CHECK_INBOX, devOtp, email }
  }

  return { message: GENERIC.CHECK_INBOX }
}

// ---------- Login ----------

export async function login({ email, password, mfaCode, backupCode, captchaToken }, req) {
  const ip = req.ip
  const userAgent = req.headers['user-agent'] || null

  const user = await User.findOne({ email })

  if (!user) {
    await compareAgainstDummy()
    await recordAttempt({ email, ip, success: false, reason: 'no_user', userAgent })
    throw fail(401, GENERIC.INVALID_CREDENTIALS)
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await recordAttempt({ email, ip, success: false, reason: 'locked', userAgent })
    throw fail(423, GENERIC.ACCOUNT_LOCKED)
  }

  if (user.failedLoginCount >= FAILED_ATTEMPTS_BEFORE_CAPTCHA) {
    const { verifyCaptcha } = await import('../middleware/captcha.js')
    const captchaOk = await verifyCaptcha(captchaToken)
    if (!captchaOk) {
      const err = fail(400, 'Please complete the CAPTCHA to continue.')
      err.requiresCaptcha = true
      throw err
    }
  }

  const passwordOk = await comparePassword(password, user.passwordHash)

  if (!passwordOk) {
    user.failedLoginCount += 1

    if (user.failedLoginCount >= FAILED_ATTEMPTS_BEFORE_LOCKOUT) {
      const overBy = user.failedLoginCount - FAILED_ATTEMPTS_BEFORE_LOCKOUT
      const minutes = Math.min(2 ** overBy, 30)
      user.lockedUntil = new Date(Date.now() + minutes * 60 * 1000)
    }
    await user.save()

    await sleep(Math.min(user.failedLoginCount * 300, 4000))

    await recordAttempt({ email, ip, success: false, reason: 'bad_password', userAgent })
    await logAudit({ actorId: user._id, action: 'auth.login_failed', req })
    throw fail(401, GENERIC.INVALID_CREDENTIALS)
  }

  if (!user.isVerified) {
    throw fail(403, 'Please verify your email before logging in.')
  }

  if (user.mfaEnabled) {
    if (!mfaCode && !backupCode) {
      const err = fail(401, 'Enter your two-factor authentication code to continue.')
      err.requiresMfa = true
      throw err
    }

    const mfaOk = await verifyMfaForLogin(user._id, mfaCode, backupCode)
    if (!mfaOk) {
      await recordAttempt({ email, ip, success: false, reason: 'mfa_failed', userAgent })
      throw fail(401, 'Invalid authentication code.')
    }
  }

  user.failedLoginCount = 0
  user.lockedUntil = null
  user.lastLoginAt = new Date()
  user.lastLoginIp = ip
  await user.save()

  const { accessToken, refreshToken } = await createSession(user, req)

  await recordAttempt({ email, ip, success: true, reason: 'success', userAgent })
  await logAudit({ actorId: user._id, action: 'auth.login', req })

  return { accessToken, refreshToken, user: sanitizeUser(user) }
}

// ---------- Session / refresh token rotation ----------

async function createSession(user, req) {
  const tokenFamilyId = crypto.randomUUID()
  const refreshToken = signRefreshToken(user._id, tokenFamilyId)

  await Session.create({
    userId: user._id,
    tokenFamilyId,
    refreshTokenHash: hashToken(refreshToken),
    device: req.headers['user-agent']?.slice(0, 200) || 'Unknown device',
    ip: req.ip,
    userAgent: req.headers['user-agent'] || null,
    expiresAt: new Date(Date.now() + refreshTokenMaxAgeMs()),
  })

  const accessToken = signAccessToken(user)
  return { accessToken, refreshToken }
}

export async function refresh(rawRefreshToken, req) {
  if (!rawRefreshToken) throw fail(401, 'No session found. Please log in.')

  let payload
  try {
    payload = verifyRefreshToken(rawRefreshToken)
  } catch {
    throw fail(401, 'Session expired. Please log in again.')
  }

  const session = await Session.findOne({ tokenFamilyId: payload.fam, userId: payload.sub })

  if (!session || session.revoked || session.expiresAt < new Date()) {
    throw fail(401, 'Session expired. Please log in again.')
  }

  const incomingHash = hashToken(rawRefreshToken)

  if (incomingHash !== session.refreshTokenHash) {
    session.revoked = true
    session.revokedReason = 'reuse_detected'
    await session.save()
    await logAudit({
      actorId: payload.sub,
      action: 'auth.refresh_reuse_detected',
      req,
      metadata: { tokenFamilyId: payload.fam },
    })
    throw fail(401, 'Session invalid. Please log in again.')
  }

  const user = await User.findById(payload.sub)
  if (!user || !user.isActive) throw fail(401, 'Account no longer accessible.')

  const newRefreshToken = signRefreshToken(user._id, payload.fam)
  session.refreshTokenHash = hashToken(newRefreshToken)
  session.lastSeen = new Date()
  session.expiresAt = new Date(Date.now() + refreshTokenMaxAgeMs())
  await session.save()

  const accessToken = signAccessToken(user)

  return { accessToken, refreshToken: newRefreshToken, user: sanitizeUser(user) }
}

export async function logout(rawRefreshToken) {
  if (!rawRefreshToken) return
  try {
    const payload = verifyRefreshToken(rawRefreshToken)
    await Session.updateOne(
      { tokenFamilyId: payload.fam, userId: payload.sub },
      { revoked: true, revokedReason: 'logout' }
    )
  } catch {
    // Invalid/expired token on logout is fine — there's nothing to revoke
  }
}

export async function logoutAllSessions(userId, reason = 'manual') {
  await Session.updateMany({ userId, revoked: false }, { revoked: true, revokedReason: reason })
}

export async function listSessions(userId) {
  const sessions = await Session.find({ userId, revoked: false, expiresAt: { $gt: new Date() } })
    .sort({ lastSeen: -1 })
    .select('-refreshTokenHash')
  return sessions
}

export async function revokeSession(userId, sessionId) {
  const session = await Session.findOne({ _id: sessionId, userId })
  if (!session) throw fail(404, 'Session not found.')
  session.revoked = true
  session.revokedReason = 'manual'
  await session.save()
}

// ---------- Password reset ----------

export async function forgotPassword(email, req) {
  const user = await User.findOne({ email })

  if (user) {
    const otp = generateOtp()
    user.passwordResetTokenHash = hashToken(otp)
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS)
    await user.save()

    const devOtp = (env.NODE_ENV !== 'production' && !env.SMTP_HOST) ? otp : null

    if (devOtp) {
      console.log(`\n[auth] Password reset OTP for ${email}: ${devOtp}\n`)
    } else {
      await sendMail({
        to: email,
        subject: 'Reset your SVBBS password',
        html: `<p>Your password reset code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center">${otp}</p><p>Expires in 10 minutes. If you didn't request this, ignore this email.</p>`,
      })
    }

    await logAudit({ actorId: user._id, action: 'auth.password_reset_requested', req })

    return { message: GENERIC.CHECK_INBOX, devOtp, email }
  }

  return { message: GENERIC.CHECK_INBOX }
}

export async function resetPassword({ otp, email, password: newPassword }, req) {
  const policyError = validatePasswordPolicy(newPassword)
  if (policyError) throw fail(400, policyError)

  if (await isPasswordBreached(newPassword)) {
    throw fail(400, 'That password has appeared in a known data breach. Please choose a different one.')
  }

  const user = await User.findOne({
    email,
    passwordResetExpires: { $gt: new Date() },
  })

  if (!user || user.passwordResetTokenHash !== hashToken(otp)) {
    throw fail(400, 'Invalid or expired code. Please request a new one.')
  }

  user.passwordHash = await hashPassword(newPassword)
  user.passwordResetTokenHash = null
  user.passwordResetExpires = null
  user.failedLoginCount = 0
  user.lockedUntil = null
  await user.save()

  await logoutAllSessions(user._id, 'password_reset')

  await logAudit({ actorId: user._id, action: 'auth.password_reset', req })

  return { message: 'Password reset. Please log in with your new password.' }
}

// ---------- Email OTP login ----------

export async function requestLoginOtp(email, req) {
  const user = await User.findOne({ email, isVerified: true })

  if (user) {
    const otp = generateOtp()
    user.emailVerificationTokenHash = hashToken(otp)
    user.emailVerificationExpires = new Date(Date.now() + LOGIN_OTP_TTL_MS)
    await user.save()

    const devOtp = (env.NODE_ENV !== 'production' && !env.SMTP_HOST) ? otp : null

    if (devOtp) {
      console.log(`\n[auth] Login OTP for ${email}: ${devOtp}\n`)
    } else {
      await sendMail({
        to: email,
        subject: 'Your SVBBS login code',
        html: `<p>Your login code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:6px;text-align:center">${otp}</p><p>Expires in 10 minutes. Never share this code.</p>`,
      })
    }

    return { message: GENERIC.CHECK_INBOX, devOtp }
  }

  return { message: GENERIC.CHECK_INBOX }
}

export async function verifyLoginOtp({ email, otp }, req) {
  const user = await User.findOne({
    email,
    isVerified: true,
    emailVerificationExpires: { $gt: new Date() },
  })

  if (!user || user.emailVerificationTokenHash !== hashToken(otp)) {
    throw fail(400, 'Invalid or expired code.')
  }

  user.emailVerificationTokenHash = null
  user.emailVerificationExpires = null
  await user.save()

  const { accessToken, refreshToken } = await createSession(user, req)
  await logAudit({ actorId: user._id, action: 'auth.login_otp', req })

  return { user: sanitizeUser(user), accessToken, refreshToken }
}

// ---------- MFA ----------

export async function mfaSetupInit(user) {
  const secret = speakeasy.generateSecret({ name: `SVBBS (${user.email})`, length: 20 })

  await MFA.findOneAndUpdate(
    { userId: user._id },
    { userId: user._id, totpSecretEncrypted: encrypt(secret.base32), enabled: false },
    { upsert: true }
  )

  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url)

  return { qrCodeDataUrl, secretBase32: secret.base32 }
}

export async function mfaSetupVerify(user, code) {
  const mfa = await MFA.findOne({ userId: user._id })
  if (!mfa) throw fail(400, 'MFA setup was not started.')

  const secret = decrypt(mfa.totpSecretEncrypted)
  const valid = speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 1 })

  if (!valid) throw fail(400, 'Invalid code. Please try again.')

  const rawBackupCodes = Array.from({ length: BACKUP_CODE_COUNT }, () =>
    crypto.randomBytes(5).toString('hex')
  )
  const hashedBackupCodes = await Promise.all(rawBackupCodes.map((c) => hashPassword(c)))

  mfa.enabled = true
  mfa.enabledAt = new Date()
  mfa.backupCodeHashes = hashedBackupCodes
  await mfa.save()

  await User.updateOne({ _id: user._id }, { mfaEnabled: true })
  await logAudit({ actorId: user._id, action: 'auth.mfa_enabled' })

  return { backupCodes: rawBackupCodes }
}

export async function mfaDisable(user, code) {
  const ok = await verifyMfaForLogin(user._id, code, null)
  if (!ok) throw fail(400, 'Invalid authentication code.')

  await MFA.deleteOne({ userId: user._id })
  await User.updateOne({ _id: user._id }, { mfaEnabled: false })
  await logAudit({ actorId: user._id, action: 'auth.mfa_disabled' })

  return { message: 'Two-factor authentication disabled.' }
}

async function verifyMfaForLogin(userId, code, backupCode) {
  const mfa = await MFA.findOne({ userId, enabled: true })
  if (!mfa) return false

  if (code) {
    const secret = decrypt(mfa.totpSecretEncrypted)
    if (speakeasy.totp.verify({ secret, encoding: 'base32', token: code, window: 1 })) return true
  }

  if (backupCode) {
    for (let i = 0; i < mfa.backupCodeHashes.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      if (await comparePassword(backupCode, mfa.backupCodeHashes[i])) {
        mfa.backupCodeHashes.splice(i, 1)
        await mfa.save()
        return true
      }
    }
  }

  return false
}

export { sanitizeUser }