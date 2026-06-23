import { env } from '../config/env.js'

/**
 * Verifies a Google reCAPTCHA token. In development (no RECAPTCHA_SECRET
 * set) this always passes but logs a warning, so the full app runs and
 * demos without needing real CAPTCHA keys. Set RECAPTCHA_SECRET in
 * production to enable real verification.
 */
export async function verifyCaptcha(token) {
  if (!env.RECAPTCHA_SECRET) {
    console.warn('[captcha] No RECAPTCHA_SECRET configured — mock-passing CAPTCHA check.')
    return true
  }

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${env.RECAPTCHA_SECRET}&response=${token}`,
    })
    const data = await res.json()
    return !!data.success
  } catch (err) {
    console.error('[captcha] Verification request failed:', err.message)
    return false
  }
}
