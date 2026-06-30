import { useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { FiBook } from 'react-icons/fi'

const TILT_RANGE = 14 // degrees — restrained, not a gimmick
const SPRING = { stiffness: 300, damping: 22, mass: 0.5 }

/**
 * Renders a book cover with a spine edge and page-thickness illusion so a
 * flat image reads as a physical book (image plan §3.1).
 *
 * Cover never breaks into a blank gray box. The title/author placeholder
 * is ALWAYS rendered as the base layer, so even while the real cover is
 * still downloading (or if it never loads), the user sees a proper styled
 * cover — not a silver plate. The real image is layered on top and fades
 * in only once it has successfully loaded as a real, non-degenerate image.
 *
 * Two separate failure detections, deliberately:
 *  - onError: catches a genuine network/HTTP failure.
 *  - onLoad + naturalWidth/naturalHeight check: catches an image that
 *    technically loaded (200 OK) but is a degenerate 1x1 placeholder
 *    pixel some hosts (including Open Library) serve instead of a 404.
 */
export default function BookCover({ src, title, author, size = 'md', className = '', interactive = false }) {
  const [loaded, setLoaded] = useState(false)
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
    } else {
      setLoaded(true)
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

  const showImage = src && !failed

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
        {/* BASE LAYER — always rendered. The styled title/author placeholder
            means the user never sees a blank gray box, even mid-download. */}
        <div className="absolute inset-0 h-full w-full flex flex-col items-center justify-center text-center p-3 bg-gradient-navy text-white">
          <FiBook size={20} className="mb-2 opacity-70" />
          <p className="font-display text-xs font-semibold leading-tight line-clamp-3">{title}</p>
          {author && <p className="text-2xs text-slate-300 mt-1 line-clamp-1">{author}</p>}
        </div>

        {/* REAL IMAGE — layered on top, fades in only once truly loaded. */}
        {showImage && (
          <img
            src={src}
            alt={`Cover of ${title}${author ? ` by ${author}` : ''}`}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={() => setFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* spine shadow down the left edge for depth */}
        <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/20 to-transparent z-10" />

        {/* glare sheen — follows the cursor, only present when tilt is enabled */}
        {tiltEnabled && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10"
            style={{ opacity: glareOpacity, background: glareBackground }}
          />
        )}
      </motion.div>
    </motion.div>
  )
}