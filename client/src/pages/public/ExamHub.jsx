import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBookOpen, FiArrowRight } from 'react-icons/fi'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import Card from '../../components/ui/Card'
import { CardSkeleton } from '../../components/ui/Skeleton'
import api from '../../services/api'

export default function ExamHub() {
  const [exams, setExams] = useState(null)

  useEffect(() => {
    api.get('/exams').then(({ data }) => setExams(data.exams)).catch(() => setExams([]))
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-navy-900 dark:text-white mb-2">
            Government Exam Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Preparation books for competitive exams, sourced from the same Knowledge Credit
            inventory as the Marketplace.
          </p>
        </div>

        {exams === null ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardSkeleton />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exams.map((exam) =>
              exam.hasInventory ? (
                <Link key={exam.code} to={`/exam-hub/${exam.code}`} className="group">
                  <Card hoverable className="h-full">
                    <div className="flex items-start justify-between mb-2">
                      <span className="grid place-items-center w-9 h-9 rounded-md bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950">
                        <FiBookOpen size={16} />
                      </span>
                      <span className="text-xs font-mono-num text-kc-500">
                        {exam.availableCount} {exam.availableCount === 1 ? 'book' : 'books'}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-semibold text-navy-900 dark:text-white mb-1 flex items-center gap-1">
                      {exam.name}
                      <FiArrowRight
                        size={14}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-kc-500"
                      />
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{exam.overview}</p>
                  </Card>
                </Link>
              ) : (
                <Card key={exam.code} className="h-full opacity-60">
                  <div className="flex items-start justify-between mb-2">
                    <span className="grid place-items-center w-9 h-9 rounded-md bg-slate-200 dark:bg-navy-600 text-slate-400">
                      <FiBookOpen size={16} />
                    </span>
                    <span className="text-xs text-slate-400">Coming soon</span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    {exam.name}
                  </h3>
                  <p className="text-sm text-slate-400 line-clamp-2">{exam.overview}</p>
                </Card>
              )
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
