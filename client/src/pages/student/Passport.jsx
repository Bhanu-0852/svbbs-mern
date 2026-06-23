import { useEffect, useState } from 'react'
import { FiHome, FiAward, FiDownload, FiUpload } from 'react-icons/fi'
import RoleShell from '../../components/layout/RoleShell'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { format } from 'date-fns'

const sidebarItems = [
  { to: '/student', label: 'Overview', icon: FiHome },
  { to: '/student/deposit', label: 'Deposit a Book', icon: FiUpload },
  { to: '/student/passport', label: 'Academic Passport', icon: FiAward },
]

const CATEGORY_LABELS = {
  engineering: 'Engineering',
  medical: 'Medical',
  government_exam: 'Government Exam',
  rare: 'Rare',
  arts: 'Arts',
  science: 'Science',
  general: 'General',
}

export default function AcademicPassport() {
  const { notify } = useToast()
  const [passport, setPassport] = useState(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    api.get('/passport/me').then(({ data }) => setPassport(data.passport)).catch(() => setPassport(null))
  }, [])

  async function handleDownload() {
    setDownloading(true)
    try {
      const response = await api.get('/passport/me/pdf', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `SVBBS-Academic-Passport-${passport?.user?.name?.replace(/\s+/g, '-') || 'student'}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      notify('Could not generate the PDF right now. Please try again.', 'error')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <RoleShell sidebarItems={sidebarItems} sidebarTitle="Student">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">
            Academic Passport
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            A verified, portable record of every book you've borrowed — exportable as a PDF you can
            keep or share.
          </p>
        </div>
        <Button variant="kc" onClick={handleDownload} disabled={downloading || !passport}>
          <FiDownload size={15} /> {downloading ? 'Generating…' : 'Download PDF'}
        </Button>
      </div>

      {passport === null ? (
        <Card>
          <CardSkeleton />
        </Card>
      ) : (
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-navy-600">
          <div className="bg-gradient-navy px-6 py-8">
            <p className="text-2xs font-semibold uppercase tracking-widest text-kc-400 mb-2">
              Knowledge Credit Economy
            </p>
            <h2 className="font-display text-2xl font-semibold text-white">Academic Passport</h2>
            <p className="text-xs text-slate-400 mt-1">Smart Vendor Book Bank System</p>
          </div>

          <div className="bg-white dark:bg-navy-700 px-6 py-6">
            <h3 className="font-display text-lg font-semibold text-navy-900 dark:text-white">
              {passport.user.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{passport.user.email}</p>
            <p className="text-xs text-slate-400 mt-1">
              Member since {format(new Date(passport.user.memberSince), 'MMMM yyyy')}
            </p>

            <div className="h-px bg-gradient-kc my-5" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              {[
                { label: 'Books Borrowed', value: passport.stats.totalBooksBorrowed },
                { label: 'KC Spent', value: passport.stats.totalKcSpent },
                { label: 'Cash Spent', value: `₹${passport.stats.totalCashSpent}` },
                { label: 'Categories', value: passport.stats.categoriesExplored.length },
              ].map((s) => (
                <div key={s.label}>
                  <p className="font-display text-2xl font-semibold text-kc-500">{s.value}</p>
                  <p className="text-2xs text-slate-400 uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>

            {passport.stats.categoriesExplored.length > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                {passport.stats.categoriesExplored.map((c) => CATEGORY_LABELS[c] || c).join('  ·  ')}
              </p>
            )}

            <div className="border-t border-slate-100 dark:border-navy-600 pt-4">
              <h4 className="font-display text-sm font-semibold text-navy-900 dark:text-white mb-3">
                Reading History
              </h4>
              {passport.books.length === 0 ? (
                <p className="text-sm text-slate-400">No books borrowed yet — browse the Marketplace to start.</p>
              ) : (
                <div className="space-y-3">
                  {passport.books.map((b, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-slate-700 dark:text-slate-200">{b.title}</p>
                        <p className="text-xs text-slate-400">{b.author}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono-num text-kc-500">{b.kcCost} KC</p>
                        <p className="text-xs text-slate-400">{format(new Date(b.borrowedAt), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </RoleShell>
  )
}
