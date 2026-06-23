import { useEffect, useState } from 'react'
import { FiUsers, FiClock } from 'react-icons/fi'
import Button from '../ui/Button'
import { useToast } from '../ui/Toast'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'

export default function WaitlistPanel({ bookId, isAuthenticated, onChange }) {
  const { notify } = useToast()
  const [myStatus, setMyStatus] = useState(null) // null | 'waiting' | 'ready'
  const [queueLength, setQueueLength] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  function load() {
    if (!isAuthenticated) {
      setLoading(false)
      return
    }
    api
      .get(`/books/${bookId}/waitlist`)
      .then(({ data }) => {
        setMyStatus(data.myStatus)
        setQueueLength(data.queueLength)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, isAuthenticated])

  async function handleJoin() {
    setSubmitting(true)
    try {
      await api.post(`/books/${bookId}/waitlist`)
      notify('Added to the waitlist — you’ll be notified when it’s your turn.', 'success')
      load()
      onChange?.()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLeave() {
    setSubmitting(true)
    try {
      await api.delete(`/books/${bookId}/waitlist`)
      notify('Removed from the waitlist.', 'info')
      load()
      onChange?.()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated || loading) return null

  return (
    <div className="mt-3 flex items-center justify-between rounded-md border border-slate-200 dark:border-navy-600 px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <FiUsers size={13} />
        {queueLength > 0
          ? `${queueLength} ${queueLength === 1 ? 'person' : 'people'} waiting`
          : 'No one waiting yet'}
        {myStatus === 'waiting' && (
          <span className="flex items-center gap-1 text-kc-500">
            <FiClock size={12} /> You're on the list
          </span>
        )}
      </div>
      {myStatus === 'waiting' ? (
        <Button variant="outline" size="sm" onClick={handleLeave} disabled={submitting}>
          Leave waitlist
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={handleJoin} disabled={submitting}>
          Join waitlist
        </Button>
      )}
    </div>
  )
}
