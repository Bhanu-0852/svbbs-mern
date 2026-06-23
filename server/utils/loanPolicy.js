export const LOAN_PERIOD_DAYS = 14
export const DUE_SOON_WINDOW_DAYS = 2 // "due soon" starts this many days before the deadline

/**
 * The due date for a borrow starting now, LOAN_PERIOD_DAYS out. A plain,
 * pure calculation — no scheduler, no background job; this is computed
 * once at borrow time and stored on the book (Book.dueDate), then read
 * on demand whenever it matters.
 */
export function calculateDueDate(borrowedAt = new Date()) {
  return new Date(borrowedAt.getTime() + LOAN_PERIOD_DAYS * 24 * 60 * 60 * 1000)
}

/**
 * Classifies a due date against the current time: 'overdue' if it's
 * already passed, 'due_soon' if it's within the warning window, 'ok'
 * otherwise. No side effects, no notification creation here — that's
 * notificationService.checkDueReminders, which uses this as its
 * decision rule. Kept separate and pure so the threshold logic has a
 * direct test, the same pattern as every other classification rule in
 * this codebase (waitlistQueue, rfidStatus, fraudSignals).
 */
export function classifyDueStatus(dueDate, now = new Date()) {
  if (!dueDate) return 'ok'
  const due = new Date(dueDate)
  if (due < now) return 'overdue'
  const warningStart = new Date(due.getTime() - DUE_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  if (now >= warningStart) return 'due_soon'
  return 'ok'
}
