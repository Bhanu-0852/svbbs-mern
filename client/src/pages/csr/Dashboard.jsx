import { useEffect, useState, useCallback } from 'react'
import { FiHome, FiGift, FiBookOpen } from 'react-icons/fi'
import RoleShell from '../../components/layout/RoleShell'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'
import { format } from 'date-fns'

const sidebarItems = [{ to: '/csr', label: 'Overview', icon: FiHome }]

const CATEGORY_LABELS = {
  engineering: 'Engineering',
  medical: 'Medical',
  government_exam: 'Govt Exam',
  rare: 'Rare',
  arts: 'Arts',
  science: 'Science',
  general: 'General',
}

function GrantModal({ open, onClose, students, onGranted }) {
  const { notify } = useToast()
  const [studentId, setStudentId] = useState('')
  const [kcAmount, setKcAmount] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!studentId || !kcAmount) {
      notify('Pick a student and an amount.', 'info')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/csr/grant', { studentId, kcAmount: Number(kcAmount), note })
      notify('Grant applied to the student’s wallet.', 'success')
      setStudentId('')
      setKcAmount('')
      setNote('')
      onGranted()
      onClose()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Grant Knowledge Credits">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Student</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
          >
            <option value="">Select a student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.walletBalance} KC)
              </option>
            ))}
          </select>
        </div>
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
            placeholder="e.g. 300"
            className="w-full rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Note (optional)</label>
          <input
            type="text"
            maxLength="200"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Engineering scholarship"
            className="w-full rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
          />
        </div>
        <Button variant="kc" className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Granting…' : 'Apply grant'}
        </Button>
      </div>
    </Modal>
  )
}

function SponsorBookModal({ open, onClose, students, books, onSponsored }) {
  const { notify } = useToast()
  const [studentId, setStudentId] = useState('')
  const [bookId, setBookId] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const selectedBook = books.find((b) => b._id === bookId)

  async function handleSubmit() {
    if (!studentId || !bookId) {
      notify('Pick a student and a book.', 'info')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/csr/sponsor-book', { studentId, bookId, note })
      notify('Book sponsored — fully covered for the student.', 'success')
      setStudentId('')
      setBookId('')
      setNote('')
      onSponsored()
      onClose()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Sponsor a Book">
      <div className="space-y-4">
        <p className="text-xs text-slate-400">
          Unlike a cash grant, this directly pays for one specific book for one specific student — it
          performs a real borrow on their behalf and never touches their own KC wallet at all.
        </p>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Student</label>
          <select
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            className="w-full rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
          >
            <option value="">Select a student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Book</label>
          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            className="w-full rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
          >
            <option value="">{books.length === 0 ? 'No available books' : 'Select a book…'}</option>
            {books.map((b) => (
              <option key={b._id} value={b._id}>
                {b.title} ({b.kcValue} KC)
              </option>
            ))}
          </select>
          {selectedBook && (
            <p className="text-xs text-slate-400 mt-1">
              This fully covers {selectedBook.kcValue} KC for {selectedBook.title} — at no cost to the student.
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Note (optional)</label>
          <input
            type="text"
            maxLength="200"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. For her semester 3 coursework"
            className="w-full rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
          />
        </div>
        <Button variant="kc" className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Sponsoring…' : 'Sponsor this book'}
        </Button>
      </div>
    </Modal>
  )
}

export default function CSRDashboard() {
  const [summary, setSummary] = useState(null)
  const [students, setStudents] = useState(null)
  const [sponsorableBooks, setSponsorableBooks] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [bookModalOpen, setBookModalOpen] = useState(false)

  const load = useCallback(() => {
    api.get('/csr/summary').then(({ data }) => setSummary(data)).catch(() => setSummary(null))
    api.get('/csr/students').then(({ data }) => setStudents(data.students)).catch(() => setStudents([]))
    api.get('/csr/sponsorable-books').then(({ data }) => setSponsorableBooks(data.books)).catch(() => setSponsorableBooks([]))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <RoleShell sidebarItems={sidebarItems} sidebarTitle="CSR Sponsor">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">
            Sponsorship Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Fund Knowledge Credits for students, or sponsor a specific book outright — fully covered,
            no cost to the student either way.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBookModalOpen(true)} disabled={!students || !sponsorableBooks}>
            <FiBookOpen size={15} /> Sponsor a book
          </Button>
          <Button variant="kc" onClick={() => setModalOpen(true)} disabled={!students}>
            <FiGift size={15} /> New grant
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 max-w-2xl">
        {summary === null ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Total KC Granted</p>
              <p className="font-display text-2xl font-semibold text-kc-500">{summary.stats.totalKcGranted}</p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Books Sponsored</p>
              <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">
                {summary.stats.booksSponsored}
              </p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Students Supported</p>
              <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">
                {summary.stats.studentsSupported}
              </p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Grants Made</p>
              <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">
                {summary.stats.grantCount}
              </p>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-1">
            Impact Report
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            What categories your sponsored books have actually gone toward — cash grants aren't
            included here since a student can spend those on anything.
          </p>
          {summary === null ? (
            <CardSkeleton />
          ) : summary.categoryBreakdown.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              No sponsored books yet — cash grants don't show up here.
            </p>
          ) : (
            summary.categoryBreakdown.map((c) => (
              <div
                key={c.category}
                className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-navy-600 last:border-0 text-sm"
              >
                <span className="text-slate-700 dark:text-slate-200">
                  {CATEGORY_LABELS[c.category] || c.category}
                </span>
                <span className="font-mono-num text-slate-500 dark:text-slate-400">{c.count}</span>
              </div>
            ))
          )}
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-3">
            Recent activity
          </h2>
          {summary === null ? (
            <CardSkeleton />
          ) : summary.recentGrants.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              Nothing yet — use “New grant” or “Sponsor a book” above.
            </p>
          ) : (
            summary.recentGrants.map((g, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-navy-600 last:border-0 text-sm"
              >
                <div>
                  <p className="text-slate-700 dark:text-slate-200">
                    {g.student?.name || 'Unknown student'}
                    {g.book && <span className="text-xs text-slate-400"> · sponsored "{g.book.title}"</span>}
                  </p>
                  <p className="text-xs text-slate-400">
                    {g.note || (g.book ? 'No note' : 'Cash grant')} · {format(new Date(g.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <span className="font-mono-num text-kc-500">+{g.kcAmount} KC</span>
              </div>
            ))
          )}
        </Card>
      </div>

      <GrantModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        students={students || []}
        onGranted={load}
      />
      <SponsorBookModal
        open={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        students={students || []}
        books={sponsorableBooks || []}
        onSponsored={load}
      />
    </RoleShell>
  )
}
