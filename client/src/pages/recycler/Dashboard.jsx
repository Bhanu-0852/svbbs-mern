import { useEffect, useState, useCallback } from 'react'
import { FiHome, FiDollarSign } from 'react-icons/fi'
import RoleShell from '../../components/layout/RoleShell'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import BookCover from '../../components/books/BookCover'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'

const sidebarItems = [{ to: '/recycler', label: 'Overview', icon: FiHome }]

function CandidateRow({ book, onRecycled }) {
  const { notify } = useToast()
  const [processing, setProcessing] = useState(false)

  async function handleRecycle() {
    setProcessing(true)
    try {
      await api.post(`/recycler/recycle/${book._id}`)
      notify(`"${book.title}" processed for recycling.`, 'success')
      onRecycled(book._id)
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-navy-600 last:border-0">
      <div className="w-9">
        <BookCover src={book.coverImage} title={book.title} author={book.author} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{book.title}</p>
        <p className="text-xs text-slate-400 truncate">{book.author}</p>
      </div>
      <Badge tone="neutral" withDot={false}>
        Poor condition
      </Badge>
      <Button variant="outline" size="sm" onClick={handleRecycle} disabled={processing}>
        {processing ? 'Processing…' : 'Recycle'}
      </Button>
    </div>
  )
}

function ProcessedRow({ book }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-navy-600 last:border-0">
      <div className="w-9 opacity-60">
        <BookCover src={book.coverImage} title={book.title} author={book.author} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{book.title}</p>
        <p className="text-xs text-slate-400 truncate">{book.author}</p>
      </div>
      <Badge tone="neutral">Recycled</Badge>
    </div>
  )
}

export default function RecyclerDashboard() {
  const [stats, setStats] = useState(null)
  const [candidates, setCandidates] = useState(null)
  const [processed, setProcessed] = useState(null)
  const [revenue, setRevenue] = useState(null)

  const loadAll = useCallback(() => {
    api.get('/recycler/stats').then(({ data }) => setStats(data.stats)).catch(() => setStats(null))
    api.get('/recycler/candidates').then(({ data }) => setCandidates(data.books)).catch(() => setCandidates([]))
    api.get('/recycler/recycled').then(({ data }) => setProcessed(data.books)).catch(() => setProcessed([]))
    api.get('/recycler/revenue').then(({ data }) => setRevenue(data)).catch(() => setRevenue(null))
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  function handleRecycled(bookId) {
    setCandidates((prev) => prev.filter((b) => b._id !== bookId))
    api.get('/recycler/stats').then(({ data }) => setStats(data.stats)).catch(() => {})
    api.get('/recycler/recycled').then(({ data }) => setProcessed(data.books)).catch(() => {})
    api.get('/recycler/revenue').then(({ data }) => setRevenue(data)).catch(() => {})
  }

  return (
    <RoleShell sidebarItems={sidebarItems} sidebarTitle="Recycler Partner">
      <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">
        Recycling Overview
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        End-of-life books that are too worn to resell get processed here, then count toward the
        platform's sustainability impact.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8 max-w-xl">
        {stats === null ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Pending in queue</p>
              <p className="font-display text-2xl font-semibold text-kc-500">{stats.pendingCandidates}</p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Total recycled</p>
              <p className="font-display text-2xl font-semibold text-forest-600 dark:text-forest-400">
                {stats.totalRecycled}
              </p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Revenue earned</p>
              <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">
                ₹{revenue === null ? '—' : revenue.totalRevenue}
              </p>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-1">
            Recycling queue
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Books flagged as poor condition and still in inventory.
          </p>
          {candidates === null ? (
            <CardSkeleton />
          ) : candidates.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              Nothing in the queue — all worn books have been processed.
            </p>
          ) : (
            candidates.map((b) => <CandidateRow key={b._id} book={b} onRecycled={handleRecycled} />)
          )}
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-3">
            Processed
          </h2>
          {processed === null ? (
            <CardSkeleton />
          ) : processed.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No books recycled yet.</p>
          ) : (
            processed.map((b) => <ProcessedRow key={b._id} book={b} />)
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-1 flex items-center gap-1.5">
          <FiDollarSign size={16} className="text-kc-500" /> Revenue Tracking
        </h2>
        <p className="text-xs text-slate-400 mb-4 max-w-2xl">
          A flat, honestly-simplified scrap value per recycled book
          {revenue ? ` (₹${revenue.scrapValuePerBook} each)` : ''} — a real recycler would price by
          weight and material, which this platform has no way to know.
        </p>
        {revenue === null ? (
          <CardSkeleton />
        ) : revenue.recent.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No revenue yet — recycle a book to start.</p>
        ) : (
          revenue.recent.map((r, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-navy-600 last:border-0 text-sm"
            >
              <span className="text-slate-700 dark:text-slate-200 truncate">{r.bookTitle}</span>
              <span className="font-mono-num text-kc-500 shrink-0 ml-2">+₹{r.cashAmount}</span>
            </div>
          ))
        )}
      </Card>
    </RoleShell>
  )
}
