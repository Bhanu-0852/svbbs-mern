import { useEffect, useState, useCallback } from 'react'
import { FiHome, FiGift, FiTrendingUp } from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import RoleShell from '../../components/layout/RoleShell'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'
import { format } from 'date-fns'

const sidebarItems = [{ to: '/college', label: 'Overview', icon: FiHome }]

const CATEGORY_LABELS = {
  engineering: 'Engineering',
  medical: 'Medical',
  government_exam: 'Govt Exam',
  rare: 'Rare',
  arts: 'Arts',
  science: 'Science',
  general: 'General',
}

function ScholarshipModal({ open, onClose, students, onAwarded }) {
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
      await api.post('/college/scholarships', { studentId, kcAmount: Number(kcAmount), note })
      notify('Scholarship applied to the student’s wallet.', 'success')
      setStudentId('')
      setKcAmount('')
      setNote('')
      onAwarded()
      onClose()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Award a Scholarship">
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
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">KC amount (1–5000)</label>
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
            placeholder="e.g. Merit scholarship, semester 3"
            className="w-full rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
          />
        </div>
        <Button variant="kc" className="w-full" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Awarding…' : 'Award scholarship'}
        </Button>
      </div>
    </Modal>
  )
}

export default function CollegeAdminDashboard() {
  const [overview, setOverview] = useState(null)
  const [students, setStudents] = useState(null)
  const [scholarships, setScholarships] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState(null)

  const loadScholarships = useCallback(() => {
    api.get('/college/scholarships').then(({ data }) => setScholarships(data)).catch(() => setScholarships(null))
  }, [])

  useEffect(() => {
    api
      .get('/college/overview')
      .then(({ data }) => setOverview(data))
      .catch((err) => setError(err?.response?.data?.message || 'Could not load college data.'))
    api.get('/college/students').then(({ data }) => setStudents(data.students)).catch(() => setStudents([]))
    api.get('/college/demand-forecast').then(({ data }) => setForecast(data)).catch(() => setForecast(null))
    loadScholarships()
  }, [loadScholarships])

  const chartData =
    overview?.categoryBreakdown?.map((c) => ({
      category: CATEGORY_LABELS[c.category] || c.category,
      count: c.count,
    })) || []

  return (
    <RoleShell sidebarItems={sidebarItems} sidebarTitle="College Admin">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">
            {overview ? overview.college.name : 'College Overview'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {overview
              ? `${overview.college.city} · ${overview.college.code} — activity across your students`
              : 'Activity across your institution’s students.'}
          </p>
        </div>
        <Button variant="kc" onClick={() => setModalOpen(true)} disabled={!students}>
          <FiGift size={15} /> Award scholarship
        </Button>
      </div>

      {error ? (
        <Card>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {overview === null ? (
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            ) : (
              <>
                <Card tilt3d padding="p-4">
                  <p className="text-2xs text-slate-400 uppercase mb-1">Students</p>
                  <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">
                    {overview.stats.totalStudents}
                  </p>
                </Card>
                <Card tilt3d padding="p-4">
                  <p className="text-2xs text-slate-400 uppercase mb-1">Total Borrows</p>
                  <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">
                    {overview.stats.totalBorrows}
                  </p>
                </Card>
                <Card tilt3d padding="p-4">
                  <p className="text-2xs text-slate-400 uppercase mb-1">KC Spent</p>
                  <p className="font-display text-2xl font-semibold text-kc-500">
                    {overview.stats.totalKcSpent}
                  </p>
                </Card>
                <Card tilt3d padding="p-4">
                  <p className="text-2xs text-slate-400 uppercase mb-1">Books Reused</p>
                  <p className="font-display text-2xl font-semibold text-forest-600 dark:text-forest-400">
                    {overview.sustainability.booksReused}
                  </p>
                </Card>
              </>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-1">
                What students are borrowing
              </h2>
              <p className="text-xs text-slate-400 mb-4">By category, across your institution.</p>
              {overview === null ? (
                <CardSkeleton />
              ) : chartData.length === 0 ? (
                <p className="text-sm text-slate-400 py-10 text-center">No borrowing activity yet.</p>
              ) : (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                        cursor={{ fill: 'rgba(240,165,0,0.08)' }}
                      />
                      <Bar dataKey="count" fill="#F0A500" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-3">
                Students
              </h2>
              {students === null ? (
                <CardSkeleton />
              ) : students.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No students enrolled yet.</p>
              ) : (
                <div>
                  {students.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-navy-600 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                          {s.name}
                          {s.collegeVerified && (
                            <Badge tone="available" withDot={false}>
                              Verified
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{s.email}</p>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                        {s.borrowCount} {s.borrowCount === 1 ? 'borrow' : 'borrows'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-1 flex items-center gap-1.5">
                <FiTrendingUp size={16} className="text-kc-500" /> Demand Forecast
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                A real signal from your students' own activity — not a trained model. Trending
                categories and books they're actively waitlisted on right now.
              </p>
              {forecast === null ? (
                <CardSkeleton />
              ) : (
                <>
                  {forecast.trendingCategories.length > 0 && (
                    <div className="mb-4">
                      <p className="text-2xs text-slate-400 uppercase mb-2">Trending categories</p>
                      <div className="flex flex-wrap gap-2">
                        {forecast.trendingCategories.map((c) => (
                          <Badge key={c.category} tone="neutral" withDot={false}>
                            {CATEGORY_LABELS[c.category] || c.category} · {c.borrowCount}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-2xs text-slate-400 uppercase mb-2">Waitlist pressure</p>
                  {forecast.waitlistPressure.length === 0 ? (
                    <p className="text-sm text-slate-400 py-2">No active waitlists among your students right now.</p>
                  ) : (
                    forecast.waitlistPressure.map((w, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-navy-600 last:border-0 text-sm"
                      >
                        <span className="text-slate-700 dark:text-slate-200 truncate">{w.title}</span>
                        <span className="text-xs text-slate-400 shrink-0 ml-2">
                          {w.waitingCount} waiting
                        </span>
                      </div>
                    ))
                  )}
                </>
              )}
            </Card>

            <Card>
              <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-3">Scholarships</h2>
              {scholarships === null ? (
                <CardSkeleton />
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-2xs text-slate-400 uppercase mb-1">KC Awarded</p>
                      <p className="font-mono-num text-lg font-semibold text-kc-500">
                        {scholarships.stats.totalKcAwarded}
                      </p>
                    </div>
                    <div>
                      <p className="text-2xs text-slate-400 uppercase mb-1">Students</p>
                      <p className="font-mono-num text-lg font-semibold text-navy-900 dark:text-white">
                        {scholarships.stats.studentsSupported}
                      </p>
                    </div>
                    <div>
                      <p className="text-2xs text-slate-400 uppercase mb-1">Awards</p>
                      <p className="font-mono-num text-lg font-semibold text-navy-900 dark:text-white">
                        {scholarships.stats.awardCount}
                      </p>
                    </div>
                  </div>
                  {scholarships.recent.length === 0 ? (
                    <p className="text-sm text-slate-400 py-6 text-center">
                      No scholarships awarded yet — use "Award scholarship" above.
                    </p>
                  ) : (
                    scholarships.recent.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-navy-600 last:border-0 text-sm"
                      >
                        <div>
                          <p className="text-slate-700 dark:text-slate-200">{s.student?.name || 'Unknown student'}</p>
                          <p className="text-xs text-slate-400">
                            {s.note || 'No note'} · {format(new Date(s.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <span className="font-mono-num text-kc-500">+{s.kcAmount} KC</span>
                      </div>
                    ))
                  )}
                </>
              )}
            </Card>
          </div>

          <p className="text-xs text-slate-400 mt-6 max-w-2xl">
            A college's footprint here is measured through its students and what they borrow — books
            themselves belong to vendors, so this never claims institutional book ownership. Money
            saved is the sum of Knowledge Credits students spent (each KC = ₹1 of cash not paid).
          </p>
        </>
      )}

      <ScholarshipModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        students={students || []}
        onAwarded={loadScholarships}
      />
    </RoleShell>
  )
}
