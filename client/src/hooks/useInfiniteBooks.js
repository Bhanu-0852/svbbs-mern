import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'

export function useInfiniteBooks({ q = '', category = '', exam = '' } = {}) {
  const [books, setBooks] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const requestId = useRef(0)

  const fetchPage = useCallback(
    async (pageToFetch, { reset = false } = {}) => {
      const thisRequest = ++requestId.current
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get('/books', {
          params: { q: q || undefined, category: category || undefined, exam: exam || undefined, page: pageToFetch, limit: 12 },
        })
        if (thisRequest !== requestId.current) return // a newer filter change superseded this request
        setBooks((prev) => (reset ? data.books : [...prev, ...data.books]))
        setHasMore(data.pagination.hasMore)
        setPage(pageToFetch)
      } catch (err) {
        if (thisRequest === requestId.current) {
          setError('Could not load books right now.')
        }
      } finally {
        if (thisRequest === requestId.current) setLoading(false)
      }
    },
    [q, category, exam]
  )

  // Reset and refetch whenever filters change
  useEffect(() => {
    fetchPage(1, { reset: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, exam])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchPage(page + 1)
  }, [loading, hasMore, page, fetchPage])

  return { books, loading, hasMore, error, loadMore }
}

/** Attaches an IntersectionObserver to a sentinel element to trigger loadMore. */
export function useInfiniteScrollSentinel(onIntersect) {
  const sentinelRef = useRef(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onIntersect()
      },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onIntersect])

  return sentinelRef
}
