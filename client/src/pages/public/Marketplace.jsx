import { useState, useEffect, useCallback } from 'react'
import { FiSearch, FiZap, FiX } from 'react-icons/fi'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import BookGrid from '../../components/books/BookGrid'
import BookCard from '../../components/books/BookCard'
import { useInfiniteBooks, useInfiniteScrollSentinel } from '../../hooks/useInfiniteBooks'
import api from '../../services/api'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'medical', label: 'Medical' },
  { value: 'government_exam', label: 'Government Exam' },
  { value: 'arts', label: 'Arts' },
  { value: 'science', label: 'Science' },
  { value: 'general', label: 'General' },
]

const FILTER_LABELS = {
  q: 'keywords',
  category: 'category',
  exam: 'exam',
  condition: 'condition',
  maxKc: 'max KC',
  minKc: 'min KC',
}

export default function Marketplace() {
  const [searchInput, setSearchInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState('')

  // AI search state
  const [aiQuery, setAiQuery] = useState('')
  const [aiResult, setAiResult] = useState(null) // null = not active; object = active results
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const { books, loading, hasMore, error, loadMore } = useInfiniteBooks({ q: debouncedQuery, category })
  const sentinelRef = useInfiniteScrollSentinel(useCallback(() => loadMore(), [loadMore]))

  async function runAiSearch(e) {
    e?.preventDefault()
    const query = aiQuery.trim()
    if (!query || aiLoading) return

    setAiLoading(true)
    setAiError('')
    try {
      const { data } = await api.post('/ai/search', { query })
      setAiResult(data)
    } catch {
      setAiError('AI search failed — try again, or use the regular search below.')
    } finally {
      setAiLoading(false)
    }
  }

  function clearAiSearch() {
    setAiResult(null)
    setAiQuery('')
    setAiError('')
  }

  const parsedChips = aiResult
    ? Object.entries(aiResult.parsedFilters || {}).map(([k, v]) => `${FILTER_LABELS[k] || k}: ${v}`)
    : []

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

        {/* AI Smart Search */}
        <div className="mb-6 rounded-xl p-px bg-gradient-kc">
          <div className="rounded-[11px] bg-white dark:bg-navy-800 p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <FiZap className="text-kc-500" size={15} />
              <span className="text-sm font-semibold text-navy-900 dark:text-white">AI Smart Search</span>
              <span className="text-2xs text-slate-400">— ask in plain English</span>
            </div>
            <form onSubmit={runAiSearch} className="flex gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder='Try "cheap science books under 100 KC" or "UPSC books in good condition"'
                className="flex-1 min-w-0 rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-900 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
              />
              <button
                type="submit"
                disabled={aiLoading || !aiQuery.trim()}
                className="shrink-0 px-4 py-2.5 rounded-md bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950 text-sm font-medium disabled:opacity-40"
              >
                {aiLoading ? 'Searching…' : 'Search'}
              </button>
            </form>
            {aiError && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{aiError}</p>}
          </div>
        </div>

        {/* AI results view */}
        {aiResult ? (
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                AI understood your search as:
              </span>
              {parsedChips.length > 0 ? (
                parsedChips.map((chip) => (
                  <span
                    key={chip}
                    className="text-xs px-2.5 py-1 rounded-full bg-kc-50 dark:bg-kc-500/10 text-kc-600 dark:text-kc-400 font-medium"
                  >
                    {chip}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">no specific filters — showing everything</span>
              )}
              <button
                onClick={clearAiSearch}
                className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-kc-500"
              >
                <FiX size={13} /> Clear AI search
              </button>
            </div>

            {aiResult.items.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center">
                No books matched that search. Try different wording or clear the AI search.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {aiResult.items.map((book) => (
                  <BookCard key={book._id} book={book} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Regular search + browse view */
          <>
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
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}