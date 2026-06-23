import { useEffect, useState } from 'react'
import { FiBookOpen, FiRefreshCw, FiCloud } from 'react-icons/fi'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import Card from '../../components/ui/Card'
import { CardSkeleton } from '../../components/ui/Skeleton'
import api from '../../services/api'

export default function Sustainability() {
  const [stats, setStats] = useState(null)
  const [breakdown, setBreakdown] = useState(null)

  useEffect(() => {
    api
      .get('/sustainability')
      .then(({ data }) => {
        setStats(data.stats)
        setBreakdown(data.categoryBreakdown)
      })
      .catch(() => {
        setStats(null)
        setBreakdown([])
      })
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-navy-900 dark:text-white mb-2">
            Sustainability Impact
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Every borrow on SVBBS keeps a book in circulation instead of printing a new one.
            Here's the platform's real, measured impact.
          </p>
        </div>

        {stats === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardSkeleton />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <Card className="text-center" padding="p-6">
              <FiBookOpen className="mx-auto text-kc-500 mb-2" size={20} />
              <p className="font-display text-3xl font-semibold text-navy-900 dark:text-white">
                {stats.booksReused}
              </p>
              <p className="text-xs text-slate-400 mt-1">Books reused</p>
            </Card>
            <Card className="text-center" padding="p-6">
              <FiRefreshCw className="mx-auto text-forest-500 mb-2" size={20} />
              <p className="font-display text-3xl font-semibold text-navy-900 dark:text-white">
                {stats.booksRecycled}
              </p>
              <p className="text-xs text-slate-400 mt-1">Books recycled</p>
            </Card>
            <Card className="text-center" padding="p-6">
              <FiCloud className="mx-auto text-forest-500 mb-2" size={20} />
              <p className="font-display text-3xl font-semibold text-navy-900 dark:text-white">
                {stats.treesSaved}
              </p>
              <p className="text-xs text-slate-400 mt-1">Trees saved (est.)</p>
            </Card>
            <Card className="text-center" padding="p-6">
              <p className="font-display text-3xl font-semibold text-kc-500">₹{stats.moneySaved}</p>
              <p className="text-xs text-slate-400 mt-1">Money saved by students</p>
            </Card>
          </div>
        )}

        <Card padding="p-6" className="mb-6">
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-4">
            Books reused by category
          </h2>
          {breakdown === null ? (
            <CardSkeleton />
          ) : breakdown.length === 0 ? (
            <p className="text-sm text-slate-400 py-10 text-center">No borrowing activity yet.</p>
          ) : (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={breakdown} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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

        <p className="text-xs text-slate-400 max-w-2xl">
          <strong>Methodology:</strong> Books reused and money saved are exact counts from real
          transactions. Trees saved and CO₂ reduced are simplified estimates (roughly 20 circulated
          books per tree, 2.5kg CO₂ per book) commonly used by sustainability dashboards — not
          precise lifecycle-assessment figures.
        </p>
      </main>

      <Footer />
    </div>
  )
}
