import crypto from 'crypto'

const COMMON_PASSWORDS = new Set([
  'password', 'password123', '12345678', 'qwerty123', 'letmein123',
  'admin1234', 'welcome123', 'iloveyou1', 'abc123456', 'football1',
])

/**
 * Strength policy: min 10 chars, at least one upper, one lower, one digit,
 * one symbol, and not a common password. Returns null if valid, or a
 * user-facing message if not.
 */
export function validatePasswordPolicy(password) {
  if (!password || password.length < 10) {
    return 'Password must be at least 10 characters long.'
  }
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.'
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.'
  if (!/[0-9]/.test(password)) return 'Password must include a number.'
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include a symbol.'
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'That password is too common. Please choose another.'
  }
  return null
}

/**
 * Checks the password against the "Have I Been Pwned" breached-password
 * database using k-anonymity: only the first 5 chars of the SHA-1 hash are
 * sent, never the password or full hash. Fails open (returns false / "not
 * breached") on network error so a third-party outage never blocks signup —
 * logged so it's visible, not silent.
 */
export async function isPasswordBreached(password) {
  try {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase()
    const prefix = sha1.slice(0, 5)
    const suffix = sha1.slice(5)

    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    })
    if (!res.ok) return false

    const text = await res.text()
    return text.split('\n').some((line) => line.startsWith(suffix))
  } catch (err) {
    console.warn('[password] HIBP check unavailable, failing open:', err.message)
    return false
  }
}
