const VALID_STATUSES = ['checked_in', 'checked_out']

/**
 * Pure toggle rule for an RFID scan: a tap flips custody status to its
 * opposite. Extracted from rfidService.js so this one-line rule has a
 * real, direct test rather than only being exercised indirectly through
 * a database-backed integration test.
 */
export function nextRfidStatus(currentStatus) {
  if (!VALID_STATUSES.includes(currentStatus)) {
    throw new Error(`Unknown RFID status: ${currentStatus}`)
  }
  return currentStatus === 'checked_in' ? 'checked_out' : 'checked_in'
}
