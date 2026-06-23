import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

/**
 * Displays the KC balance. Whenever the value changes (e.g. right after
 * a borrow, grant, or sponsorship), it gets both the original gold pulse
 * glow (the existing "counts up / pulses gold" micro-interaction) and a
 * genuine 3D coin-flip rotation layered on top — this is the app's whole
 * identity number, so it gets the most pronounced single 3D moment in
 * the build. Under prefers-reduced-motion, the flip is skipped entirely
 * (the gold pulse glow still plays — it's a color/shadow change, not a
 * motion/rotation effect, so it isn't what reduced-motion users are
 * opting out of).
 */
export default function KCBalance({ balance, loading }) {
  const [pulse, setPulse] = useState(false)
  const [flipKey, setFlipKey] = useState(0)
  const prevRef = useRef(balance)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prevRef.current !== null && balance !== null && prevRef.current !== balance) {
      setPulse(true)
      setFlipKey((k) => k + 1)
      const t = setTimeout(() => setPulse(false), 600)
      return () => clearTimeout(t)
    }
    prevRef.current = balance
  }, [balance])

  if (loading || balance === null) return null

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-kc-50 dark:bg-kc-500/10 text-kc-500 font-mono-num text-xs font-semibold transition-shadow ${
        pulse ? 'animate-count-pulse' : ''
      }`}
      style={prefersReducedMotion ? undefined : { perspective: 200 }}
    >
      {prefersReducedMotion ? (
        <span>{balance} KC</span>
      ) : (
        <motion.span
          key={flipKey}
          initial={flipKey > 0 ? { rotateX: -180 } : false}
          animate={{ rotateX: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 20 }}
          style={{ display: 'inline-block', transformStyle: 'preserve-3d' }}
        >
          {balance} KC
        </motion.span>
      )}
    </span>
  )
}
