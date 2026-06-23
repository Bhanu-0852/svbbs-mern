export function ok(res, data = {}, message = 'OK') {
  return res.status(200).json({ success: true, message, ...data })
}

export function created(res, data = {}, message = 'Created') {
  return res.status(201).json({ success: true, message, ...data })
}

export function fail(status, message) {
  const err = new Error(message)
  err.statusCode = status
  return err
}

// Generic responses used to avoid email enumeration / detail leaks (spec §9.2, §9.3, §9.5)
export const GENERIC = {
  INVALID_CREDENTIALS: 'Invalid email or password.',
  CHECK_INBOX: 'If that email is registered, check your inbox for next steps.',
  ACCOUNT_LOCKED: 'Too many attempts. Please try again later.',
}
