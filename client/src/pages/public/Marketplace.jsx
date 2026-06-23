import { useState, useEffect, useCallback } from 'react'
import { FiSearch } from 'react-icons/fi'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import BookGrid from '../../components/books/BookGrid'
import { useInfiniteBooks, useInfiniteScrollSentinel } from '../../hooks/useInfiniteBooks'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'medical', label: 'Medical' },
  { value: 'government_exam', label: 'Government Exam' },
  { value: 'arts', label: 'Arts' },
  { value: 'science', label: 'Science' },
  { value: 'general', label: 'General' },
]

export default function Marketplace() {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const { books, loading, hasMore, error, loadMore } = useInfiniteBooks({ q: debouncedQuery, category })
  const sentinelRef = useInfiniteScrollSentinel(useCallback(() => loadMore(), [loadMore]))

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-navy-900 dark:text-white mb-2">
            Marketplace
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Every cover is a real book in the inventory. Borrow with Knowledge Credits, or top up with
            cash for the rest.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title or author"
              aria-label="Search books"
              className="w-full rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`shrink-0 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  category === c.value
                    ? 'bg-navy-900 text-white dark:bg-kc-500 dark:text-navy-950'
                    : 'bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-600'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <BookGrid books={books} loading={loading} hasMore={hasMore} error={error} sentinelRef={sentinelRef} />
      </main>

      <Footer />
    </div>
  )
}
