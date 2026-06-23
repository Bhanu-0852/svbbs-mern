import { useEffect, useState } from 'react'
import { FiRepeat } from 'react-icons/fi'
import Button from '../ui/Button'
import { useToast } from '../ui/Toast'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'

export default function ExchangeProposePanel({ bookId, isOwner, isAuthenticated, onProposed }) {
  const { notify } = useToast()
  const [myBooks, setMyBooks] = useState(null)
  const [selectedId, setSelectedId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || isOwner) {
      setMyBooks([])
      return
    }
    api
      .get('/books/mine')
      .then(({ data }) => setMyBooks(data.books.filter((b) => b.status === 'available')))
      .catch(() => setMyBooks([]))
  }, [isAuthenticated, isOwner])

  async function handlePropose() {
    if (!selectedId) {
      notify('Pick one of your own books to offer first.', 'info')
      return
    }
    setSubmitting(true)
    try {
      await api.post(`/books/${bookId}/exchange-propose`, { offeredBookId: selectedId })
      notify('Swap proposed — the owner will accept or decline it.', 'success')
      setSelectedId('')
      onProposed?.()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (isOwner) {
    return (
      <div className="rounded-md border border-slate-200 dark:border-navy-600 px-3 py-2.5 mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <FiRepeat size={13} /> This is your listing — open to swap proposals from other students
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-md border border-slate-200 dark:border-navy-600 px-3 py-2.5 mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <FiRepeat size={13} /> Log in to propose a swap for this book
      </div>
    )
  }

  return (
    <div className="rounded-md border border-slate-200 dark:border-navy-600 px-3 py-2.5 mt-1">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-2">
        <FiRepeat size={13} /> Listed for exchange — offer one of your own books for it
      </p>
      {myBooks === null ? (
        <p className="text-xs text-slate-400">Loading your books…</p>
      ) : myBooks.length === 0 ? (
        <p className="text-xs text-slate-400">
          You don't have any available books of your own to offer yet — deposit one first.
        </p>
      ) : (
        <div className="flex gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 min-w-0 rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
          >
            <option value="">Select a book to offer…</option>
            {myBooks.map((b) => (
              <option key={b._id} value={b._id}>
                {b.title}
              </option>
            ))}
          </select>
          <Button variant="primary" size="sm" onClick={handlePropose} disabled={submitting || !selectedId}>
            {submitting ? 'Proposing…' : 'Propose'}
          </Button>
        </div>
      )}
    </div>
  )
}
