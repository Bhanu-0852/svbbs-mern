import { useState } from 'react'
import { FiBarChart2, FiClock, FiLayers, FiTrendingUp, FiZap } from 'react-icons/fi'
import api from '../../services/api'

const LEVEL_STYLE = {
  Beginner: 'text-forest-600 dark:text-forest-400 bg-forest-50 dark:bg-forest-500/10',
  Intermediate: 'text-kc-600 dark:text-kc-400 bg-kc-50 dark:bg-kc-500/10',
  Advanced: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10',
}

// Visual difficulty meter: 1 bar for Beginner, 2 for Intermediate, 3 for Advanced
function DifficultyMeter({ level }) {
  const filled = level === 'Advanced' ? 3 : level === 'Intermediate' ? 2 : 1
  return (
    <div className="flex gap-1" aria-label={`Difficulty: ${level}`}>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`h-1.5 w-8 rounded-full ${
            i <= filled
              ? level === 'Advanced'
                ? 'bg-red-500'
                : level === 'Intermediate'
                  ? 'bg-kc-500'
                  : 'bg-forest-500'
              : 'bg-slate-200 dark:bg-navy-600'
          }`}
        />
      ))}
    </div>
  )
}

export default function ReadingDifficultyPanel({ title, author, categoryTags, examTags, description }) {
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [result, setResult] = useState(null)

  async function analyze() {
    setState('loading')
    try {
      const { data } = await api.post('/ai/reading-difficulty', {
        title,
        author,
        categoryTags,
        examTags,
        description,
      })
      setResult(data)
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 dark:border-navy-600 p-5 bg-white dark:bg-navy-800">
      <div className="flex items-center gap-2 mb-1">
        <FiBarChart2 className="text-kc-500" size={16} />
        <h3 className="font-display text-sm font-semibold text-navy-900 dark:text-white">
          Reading Difficulty
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        An AI estimate of how challenging this book is and how long it takes.
      </p>

      {state === 'idle' && (
        <button
          onClick={analyze}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950 text-sm font-medium"
        >
          <FiZap size={14} /> Analyze difficulty
        </button>
      )}

      {state === 'loading' && (
        <div className="space-y-2">
          <div className="skeleton h-6 w-32 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
        </div>
      )}

      {state === 'error' && (
        <div>
          <p className="text-sm text-red-500 mb-2">Couldn't analyze this book right now.</p>
          <button onClick={() => setState('idle')} className="text-xs text-kc-500 hover:underline">
            Try again
          </button>
        </div>
      )}

      {state === 'done' && result && (
        <div className="animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${LEVEL_STYLE[result.level] || ''}`}>
              {result.level}
            </span>
            <DifficultyMeter level={result.level} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-2">
              <FiClock size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-2xs text-slate-400 uppercase">Reading time</p>
                <p className="text-slate-700 dark:text-slate-200">~{result.estimatedReadingTimeHours} hours</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FiLayers size={15} className="text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-2xs text-slate-400 uppercase">Suits</p>
                <p className="text-slate-700 dark:text-slate-200">{result.suitableSemester}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-2xs text-slate-400 uppercase mb-1">Prerequisites</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{result.prerequisites}</p>
          </div>

          <div className="flex items-start gap-2">
            <FiTrendingUp size={15} className="text-kc-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-2xs text-slate-400 uppercase mb-0.5">Learning curve</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{result.learningCurve}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}