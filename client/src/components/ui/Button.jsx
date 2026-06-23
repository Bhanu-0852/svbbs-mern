import { motion, useReducedMotion } from 'framer-motion'

const VARIANTS = {
  primary:
    'bg-navy-900 text-white hover:bg-navy-800 dark:bg-slate-100 dark:text-navy-900 dark:hover:bg-white',
  kc:
    'bg-gradient-kc text-navy-950 font-semibold hover:shadow-glow-kc',
  outline:
    'border border-slate-300 dark:border-navy-500 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-700',
  ghost:
    'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700',
  danger:
    'bg-red-600 text-white hover:bg-red-700',
}

const SIZES = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

/**
 * The press feedback is a real, tactile depth illusion, not just a flat
 * scale: the button tilts very slightly while compressing, so it reads
 * as being pushed into the page rather than just shrinking — then
 * springs back open. Falls back to a plain scale (no rotateX) under
 * prefers-reduced-motion, same as every other 3D effect in this build.
 *
 * motion.create() (not a string-keyed motion.div lookup) is what
 * correctly wraps an arbitrary custom component passed via `as` — e.g.
 * React Router's <Link> — so it keeps its real behavior (actual
 * navigation) instead of silently being replaced by a plain animated
 * div that looks identical but does nothing when clicked. Verified
 * directly against framer-motion's own source: it renders the real
 * wrapped component via createElement, not a substitute.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  as: Component = 'button',
  ...rest
}) {
  const prefersReducedMotion = useReducedMotion()

  const classes = `
    inline-flex items-center justify-center gap-2 rounded-md font-medium
    transition-colors duration-150 ease-smooth
    disabled:opacity-50 disabled:cursor-not-allowed
    ${VARIANTS[variant]} ${SIZES[size]} ${className}
  `

  const motionProps = disabled
    ? {}
    : prefersReducedMotion
      ? { whileTap: { scale: 0.97 }, transition: { duration: 0.1 } }
      : {
          whileTap: { scale: 0.96, rotateX: 6, y: 1 },
          whileHover: { y: -1 },
          transition: { type: 'spring', stiffness: 500, damping: 25 },
          style: { perspective: 400 },
        }

  if (Component === 'button') {
    return (
      <motion.button type={type} disabled={disabled} className={classes} {...motionProps} {...rest}>
        {children}
      </motion.button>
    )
  }

  const MotionComponent = motion.create(Component)
  return (
    <MotionComponent className={classes} {...motionProps} {...rest}>
      {children}
    </MotionComponent>
  )
}
