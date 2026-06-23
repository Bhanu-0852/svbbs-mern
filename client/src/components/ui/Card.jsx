import { useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'

const TILT_RANGE = 6 // degrees — noticeably subtler than book covers; cards hold real content, not just imagery
const SPRING = { stiffness: 280, damping: 24, mass: 0.6 }

/**
 * hoverable keeps the original flat shadow-only behavior (used widely,
 * left unchanged so nothing currently using hoverable shifts visually).
 * tilt3d is the new, opt-in layered-depth treatment: a restrained 3D
 * tilt toward the cursor plus a lift, for the stat cards and dashboard
 * panels this build specifically wants reading as "floating layers."
 *
 * Falls back to a plain lift-and-shadow (no rotation) under
 * prefers-reduced-motion — see BookCover.jsx for why useReducedMotion()
 * is called per-component rather than via an app-level MotionConfig.
 */
export default function Card({ children, className = '', hoverable = false, tilt3d = false, padding = 'p-6', ...rest }) {
  const ref = useRef(null)
  const prefersReducedMotion = useReducedMotion()
  const tiltEnabled = tilt3d && !prefersReducedMotion

  const rawRotateX = useMotionValue(0)
  const rawRotateY = useMotionValue(0)
  const rotateX = useSpring(rawRotateX, SPRING)
  const rotateY = useSpring(rawRotateY, SPRING)
  const rawLift = useMotionValue(0)
  const lift = useSpring(rawLift, SPRING)
  const boxShadow = useTransform(
    lift,
    [0, 1],
    ['0 1px 3px rgba(0,0,0,0.10), 0 1px 2px rgba(0,0,0,0.06)', '0 20px 40px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.10)']
  )
  const translateY = useTransform(lift, [0, 1], [0, -4])

  function handlePointerMove(e) {
    if (!ref.current) return
    if (tiltEnabled) {
      const rect = ref.current.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      rawRotateY.set((px - 0.5) * 2 * TILT_RANGE)
      rawRotateX.set((0.5 - py) * 2 * TILT_RANGE)
    }
    if (tilt3d) rawLift.set(1) // lift/shadow still applies under reduced motion, just without rotation
  }

  function handlePointerLeave() {
    rawRotateX.set(0)
    rawRotateY.set(0)
    rawLift.set(0)
  }

  if (tilt3d) {
    return (
      <motion.div
        ref={ref}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          rotateX: tiltEnabled ? rotateX : 0,
          rotateY: tiltEnabled ? rotateY : 0,
          boxShadow,
          translateY,
          perspective: tiltEnabled ? 800 : undefined,
        }}
        className={`bg-paper-card dark:bg-navy-700 rounded-xl border border-slate-200/70 dark:border-navy-600/60 ${padding} ${className}`}
        {...rest}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div
      className={`
        bg-paper-card dark:bg-navy-700 rounded-xl shadow-card
        border border-slate-200/70 dark:border-navy-600/60
        ${padding}
        ${hoverable ? 'transition-shadow duration-200 hover:shadow-card-hover' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  )
}
