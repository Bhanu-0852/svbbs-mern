import { useEffect } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FiX } from 'react-icons/fi'

export default function Modal({ open, onClose, title, children }) {
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  // Full 3D swoop normally; a plain fade under reduced motion — same end
  // state either way, just without the rotation/scale journey there.
  const panelVariants = prefersReducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, scale: 0.85, rotateX: -12, y: 24 },
        animate: { opacity: 1, scale: 1, rotateX: 0, y: 0 },
        exit: { opacity: 0, scale: 0.9, rotateX: 8, y: 12 },
      }

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          style={prefersReducedMotion ? undefined : { perspective: 1200 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="relative w-full max-w-md bg-white dark:bg-navy-700 rounded-xl shadow-card-hover p-6"
            initial={panelVariants.initial}
            animate={panelVariants.animate}
            exit={panelVariants.exit}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            style={prefersReducedMotion ? undefined : { transformStyle: 'preserve-3d' }}
          >
            <div className="flex items-center justify-between mb-4">
              {title && (
                <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white">{title}</h2>
              )}
              <button
                onClick={onClose}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <FiX size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
