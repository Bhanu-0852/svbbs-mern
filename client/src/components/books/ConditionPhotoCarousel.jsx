import { useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import BookCover from './BookCover'

export default function ConditionPhotoCarousel({ photos, title, author }) {
  const [index, setIndex] = useState(0)
  if (!photos || photos.length === 0) return null

  const next = () => setIndex((i) => (i + 1) % photos.length)
  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length)

  return (
    <div className="flex items-center gap-2">
      {photos.length > 1 && (
        <button
          onClick={prev}
          aria-label="Previous photo"
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-700"
        >
          <FiChevronLeft size={16} />
        </button>
      )}

      <div className="w-20">
        <BookCover src={photos[index]} title={title} author={author} size="sm" />
      </div>

      {photos.length > 1 && (
        <button
          onClick={next}
          aria-label="Next photo"
          className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-700"
        >
          <FiChevronRight size={16} />
        </button>
      )}

      {photos.length > 1 && (
        <span className="text-xs text-slate-400 ml-1">
          {index + 1} / {photos.length}
        </span>
      )}
    </div>
  )
}
