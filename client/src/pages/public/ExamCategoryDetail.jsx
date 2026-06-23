import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiSearch } from 'react-icons/fi'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import BookGrid from '../../components/books/BookGrid'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { useInfiniteBooks, useInfiniteScrollSentinel } from '../../hooks/useInfiniteBooks'
import api from '../../services/api'

export default function ExamCategoryDetail() {
  const { code } = useParams()
  const [exam, setExam] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    api.get(`/exams/${code}`).then(({ data }) => setExam(data.exam)).catch(() => setExam(null))
  }, [code])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const { books, loading, hasMore, error, loadMore } = useInfiniteBooks({ q: debouncedQuery, exam: code })
  const sentinelRef = useInfiniteScrollSentinel(useCallback(() => loadMore(), [loadMore]))

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        <Link
          to="/exam-hub"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white mb-6"
        >
          <FiArrowLeft size={14} /> Back to Exam Hub
        </Link>

        {exam === null ? (
          <CardSkeleton />
        ) : (
          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-navy-900 dark:text-white mb-2">
              {exam.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">{exam.overview}</p>
          </div>
        )}

        <div className="relative max-w-sm mb-6">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={`Search ${exam?.name || 'this category'}`}
            aria-label="Search books in this exam category"
            className="w-full rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
          />
        </div>

        <BookGrid
          books={books}
          loading={loading}
          hasMore={hasMore}
          error={error}
          sentinelRef={sentinelRef}
          emptyMessage="No books are tagged for this exam yet."
        />
      </main>

      <Footer />
    </div>
  )
}
