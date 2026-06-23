const TONES = {
  available: 'bg-forest-100 text-forest-700 dark:bg-forest-700/20 dark:text-forest-300',
  onloan: 'bg-slate-100 text-slate-600 dark:bg-navy-600/40 dark:text-slate-300',
  reserved: 'bg-kc-100 text-kc-500 dark:bg-kc-500/15 dark:text-kc-300',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-navy-600/40 dark:text-slate-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const DOT_TONES = {
  available: 'bg-forest-500',
  onloan: 'bg-slate-400',
  reserved: 'bg-kc-500',
  neutral: 'bg-slate-400',
  danger: 'bg-red-500',
}

/**
 * Status communicated through a small colored dot + a clear word,
 * not an emoji. See design plan §2.4.
 */
export default function Badge({ tone = 'neutral', children, withDot = true, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {withDot && <span className={`w-1.5 h-1.5 rounded-full ${DOT_TONES[tone]}`} aria-hidden="true" />}
      {children}
    </span>
  )
}
