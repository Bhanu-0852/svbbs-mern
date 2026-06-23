import { useEffect, useState, useCallback } from 'react'
import { FiHome } from 'react-icons/fi'
import RoleShell from '../../components/layout/RoleShell'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import BookCover from '../../components/books/BookCover'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'
import { format } from 'date-fns'

const sidebarItems = [{ to: '/parent', label: 'Overview', icon: FiHome }]

function TopUpModal({ open, onClose, child, onToppedUp }) {
  const { notify } = useToast()
  const [kcAmount, setKcAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!kcAmount) {
      notify('Enter an amount.', 'info')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/parent/topup', { studentId: child.id, kcAmount: Number(kcAmount) })
      notify(`Added ${kcAmount} KC to ${child.name}'s wallet.`, 'success')
      setKcAmount('')
      onToppedUp()
      onClose()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!child) return null

  return (
    <Modal open={open} onClose={onClose} title={`Top up ${child.name}'s wallet`}>
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          This is the only student you can top up — your account is linked to {child.name} specifically.
        </p>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
            KC amount (1–5000)
          </label>
          <input
            type="number"
            min="1"
            max="5000"
            value={kcAmount}
            onChange={(e) => setKcAmount(e.target.value)}
            placeholder="e.g. 200"
            className="w-full rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
          />
        </div>
        <Button variant="kc" className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Adding…' : 'Add to wallet'}
        </Button>
      </div>
    </Modal>
  )
}

export default function ParentDashboard() {
  const [children, setChildren] = useState(null)
  const [activity, setActivity] = useState(null)
  const [modalChild, setModalChild] = useState(null)

  const loadChildren = useCallback(() => {
    api.get('/parent/children').then(({ data }) => setChildren(data.children)).catch(() => setChildren([]))
  }, [])

  useEffect(() => {
    loadChildren()
  }, [loadChildren])

  useEffect(() => {
    if (children && children.length > 0) {
      api
        .get(`/parent/activity/${children[0].id}`)
        .then(({ data }) => setActivity(data.activity))
        .catch(() => setActivity([]))
    }
  }, [children])

  return (
    <RoleShell sidebarItems={sidebarItems} sidebarTitle="Parent / Guardian">
      <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">
        Family Overview
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-lg">
        You can top up Knowledge Credits only for your own linked child — unlike a CSR sponsor, who
        can fund any student, your reach here is intentionally limited to your family.
      </p>

      {children === null ? (
        <CardSkeleton />
      ) : children.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-400 py-6 text-center">
            No student is linked to your account yet.
          </p>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-3">
              Linked children
            </h2>
            {children.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-navy-600 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.email}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.borrowCount} {c.borrowCount === 1 ? 'borrow' : 'borrows'} so far
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono-num text-lg text-kc-500 mb-1">{c.walletBalance} KC</p>
                  <Button variant="outline" size="sm" onClick={() => setModalChild(c)}>
                    Top up
                  </Button>
                </div>
              </div>
            ))}
          </Card>

          <Card>
            <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-1">
              Impact view
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              What {children[0]?.name}'s Knowledge Credits have gone toward.
            </p>
            {activity === null ? (
              <CardSkeleton />
            ) : activity.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No borrows yet.</p>
            ) : (
              activity.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-navy-600 last:border-0">
                  <div className="w-8">
                    <BookCover src={a.book?.coverImage} title={a.book?.title} author={a.book?.author} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{a.book?.title || 'Unknown book'}</p>
                    <p className="text-xs text-slate-400">{format(new Date(a.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <span className="text-xs font-mono-num text-slate-500 dark:text-slate-400 shrink-0">
                    {a.kcUsed} KC{a.cashDue > 0 ? ` +₹${a.cashDue}` : ''}
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      <TopUpModal open={!!modalChild} onClose={() => setModalChild(null)} child={modalChild} onToppedUp={loadChildren} />
    </RoleShell>
  )
}
