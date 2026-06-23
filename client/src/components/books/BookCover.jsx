import { useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { FiBook } from 'react-icons/fi'

const TILT_RANGE = 14 // degrees — restrained, not a gimmick
const SPRING = { stiffness: 300, damping: 22, mass: 0.5 }

/**
 * Renders a book cover with a spine edge and page-thickness illusion so a
 * flat image reads as a physical book (image plan §3.1). Falls back to a
 * generated title/author placeholder if the image fails to load — covers
 * should never break into a gray box.
 *
 * Two separate failure detections, deliberately, not just one:
 *  - onError: catches a genuine network/HTTP failure (the image request
 *    itself failed).
 *  - onLoad + naturalWidth/naturalHeight check: catches an image that
 *    technically loaded without erroring but is degenerate — a
 *    near-empty or 1x1 placeholder pixel some image hosts (including
 *    Open Library in certain edge cases) serve with a normal 200 OK
 *    instead of a real 404. onError alone never fires for this case,
 *    since the browser considers the load "successful" — without this
 *    second check, a degenerate image would render as an invisible box
 *    over the card's own background color instead of the real fallback.
 *
 * When interactive, the cover also tilts in real 3D toward the cursor
 * (mouse-tracked rotateX/rotateY via framer-motion, spring-smoothed) with
 * a glare sheen that moves across the surface — the signature visual
 * touch for a book platform specifically, applied everywhere a cover
 * appears since BookCard (Marketplace, Exam Hub, Recommendations, every
 * listing) already passes interactive.
 *
 * useReducedMotion() (not the app-level MotionConfig) is the deliberate
 * choice here: every component using framer-motion already imports it
 * for its own motion needs, so calling the hook costs nothing extra to
 * bundle, and it avoids importing framer-motion eagerly at the
 * always-loaded App.jsx root, which would risk pulling the whole library
 * out of its own lazily-fetched chunk for every visitor regardless of
 * whether they ever reach a page with a 3D effect.
 */
export default function BookCover({ src, title, author, size = 'md', className = '', interactive = false }) {
  const [failed, setFailed] = useState(false)
  const ref = useRef(null)
  const prefersReducedMotion = useReducedMotion()
  const tiltEnabled = interactive && !prefersReducedMotion

  function handleImageLoad(e) {
    const img = e.target
    // A real cover is never this small — anything under ~20px on either
    // side is treated as a degenerate placeholder pixel, not content.
    if (img.naturalWidth < 20 || img.naturalHeight < 20) {
      setFailed(true)
    }
  }

  const rawRotateX = useMotionValue(0)
  const rawRotateY = useMotionValue(0)
  const rotateX = useSpring(rawRotateX, SPRING)
  const rotateY = useSpring(rawRotateY, SPRING)
  const glareX = useTransform(rawRotateY, [-TILT_RANGE, TILT_RANGE], [0, 100])
  const glareY = useTransform(rawRotateX, [TILT_RANGE, -TILT_RANGE], [0, 100])
  const rawGlareOpacity = useMotionValue(0)
  const glareOpacity = useSpring(rawGlareOpacity, SPRING)
  const glareBackground = useTransform([glareX, glareY], ([gx, gy]) =>
    `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.35), transparent 55%)`
  )

  const SIZES = {
    sm: 'w-20',
    md: 'w-full',
    lg: 'w-full',
  }

  function handlePointerMove(e) {
    if (!tiltEnabled || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width // 0–1
    const py = (e.clientY - rect.top) / rect.height // 0–1
    rawRotateY.set((px - 0.5) * 2 * TILT_RANGE)
    rawRotateX.set((0.5 - py) * 2 * TILT_RANGE)
    rawGlareOpacity.set(1)
  }

  function handlePointerLeave() {
    rawRotateX.set(0)
    rawRotateY.set(0)
    rawGlareOpacity.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={tiltEnabled ? { perspective: 800 } : undefined}
      className={`relative aspect-[2/3] ${SIZES[size]} ${className} ${
        interactive ? 'transition-transform duration-200 ease-spring hover:-translate-y-2' : ''
      }`}
    >
      {/* page-thickness illusion: a thin offset edge behind the cover */}
      <div className="absolute inset-y-0.5 -right-1 w-1 rounded-r-sm bg-slate-300 dark:bg-navy-500" />
      <div className="absolute inset-y-1 -right-1.5 w-1 rounded-r-sm bg-slate-200 dark:bg-navy-600" />

      <motion.div
        style={tiltEnabled ? { rotateX, rotateY, transformStyle: 'preserve-3d' } : undefined}
        className={`relative h-full w-full rounded-md overflow-hidden shadow-book ${
          interactive ? 'group-hover:shadow-book-hover' : ''
        } bg-slate-100 dark:bg-navy-700`}
      >
        {!failed && src ? (
          <img
            src={src}
            alt={`Cover of ${title}${author ? ` by ${author}` : ''}`}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-center p-3 bg-gradient-navy text-white">
            <FiBook size={20} className="mb-2 opacity-70" />
            <p className="font-display text-xs font-semibold leading-tight line-clamp-3">{title}</p>
            {author && <p className="text-2xs text-slate-300 mt-1 line-clamp-1">{author}</p>}
          </div>
        )}

        {/* spine shadow down the left edge for depth */}
        <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/20 to-transparent" />

        {/* glare sheen — follows the cursor, only present when tilt is enabled */}
        {tiltEnabled && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ opacity: glareOpacity, background: glareBackground }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}
