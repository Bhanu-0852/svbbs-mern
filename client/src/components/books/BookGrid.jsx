import { FiLoader } from 'react-icons/fi'
import { motion, useReducedMotion } from 'framer-motion'
import BookCard from './BookCard'
import { BookCoverSkeleton } from '../ui/Skeleton'

// Caps the stagger window so pagination doesn't accumulate an
// ever-growing entrance delay for later pages — only the first ~10
// positions in each render batch get a staggered delay; everything past
// that enters at the same (small) delay rather than queueing further out.
const MAX_STAGGER_INDEX = 10
const STAGGER_STEP = 0.04

export default function BookGrid({ books, loading, hasMore, error, sentinelRef, emptyMessage }) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8">
        {books.map((book, i) =>
          prefersReducedMotion ? (
            <div key={book._id}>
              <BookCard book={book} />
            </div>
          ) : (
            <motion.div
              key={book._id}
              initial={{ opacity: 0, y: 20, rotateX: -8 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                type: 'spring',
                stiffness: 220,
                damping: 22,
                delay: Math.min(i, MAX_STAGGER_INDEX) * STAGGER_STEP,
              }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <BookCard book={book} />
            </motion.div>
          )
        )}

        {loading &&
          Array.from({ length: books.length === 0 ? 10 : 5 }).map((_, i) => (
            <div key={`skeleton-${i}`}>
              <BookCoverSkeleton />
            </div>
          ))}
      </div>

      {!loading && books.length === 0 && !error && (
        <div className="text-center py-16">
          <p className="text-sm text-slate-400">{emptyMessage || 'No books match your search just yet.'}</p>
        </div>
      )}

      {hasMore && !loading && <div ref={sentinelRef} className="h-1" aria-hidden="true" />}

      {loading && books.length > 0 && (
        <div className="flex justify-center py-6">
          <FiLoader className="animate-spin text-slate-400" size={20} />
        </div>
      )}
    </>
  )
}
