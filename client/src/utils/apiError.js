export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.message || fallback
}

export function requiresCaptcha(err) {
  return !!err?.response?.data?.requiresCaptcha
}

export function requiresMfa(err) {
  return !!err?.response?.data?.requiresMfa
}
