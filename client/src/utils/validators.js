// Mirrors server/utils/password.js validatePasswordPolicy(). This is UX
// convenience only — the server re-validates everything independently
// and is the actual source of truth (spec §9.9).
export function checkPasswordStrength(password) {
  const checks = [
    { label: 'At least 10 characters', valid: password.length >= 10 },
    { label: 'An uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'A lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'A number', valid: /[0-9]/.test(password) },
    { label: 'A symbol', valid: /[^A-Za-z0-9]/.test(password) },
  ]
  const passedCount = checks.filter((c) => c.valid).length
  return { checks, isValid: passedCount === checks.length, score: passedCount }
}
