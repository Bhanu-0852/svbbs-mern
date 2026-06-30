import { useState } from 'react'
import { FiGitMerge, FiZap } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import api from '../../services/api'

function ScoreBadge({ score }) {
  const tone =
    score >= 80 ? 'text-forest-600 dark:text-forest-400 bg-forest-50 dark:bg-forest-500/10'
    : score >= 60 ? 'text-kc-600 dark:text-kc-400 bg-kc-50 dark:bg-kc-500/10'
    : 'text-slate-500 bg-slate-100 dark:bg-navy-700'
  return (
    <span className={`shrink-0 font-mono-num text-sm font-bold px-2.5 py-1 rounded-full ${tone}`}>
      {score}%
    </span>
  )
}

export default function ExchangeMatchPanel({ bookId }) {
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [result, setResult] = useState(null)

  async function findMatches() {
    setState('loading')
    try {
      const { data } = await api.get(`/exchange-match/${bookId}`)
      setResult(data)
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 dark:border-navy-600 p-5 bg-white dark:bg-navy-800">
      <div className="flex items-center gap-2 mb-1">
        <FiGitMerge className="text-kc-500" size={16} />
        <h3 className="font-display text-sm font-semibold text-navy-900 dark:text-white">
          AI Smart Exchange Matching
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        Find the best swap partners for this book — ranked by KC fairness, subject fit, and college.
      </p>

      {state === 'idle' && (
        <button
          onClick={findMatches}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950 text-sm font-medium"
        >
          <FiZap size={14} /> Find best matches
        </button>
      )}

      {state === 'loading' && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {state === 'error' && (
        <div>
          <p className="text-sm text-red-500 mb-2">Couldn't find matches right now.</p>
          <button onClick={() => setState('idle')} className="text-xs text-kc-500 hover:underline">
            Try again
          </button>
        </div>
      )}

      {state === 'done' && result && (
        <div className="animate-fade-in">
          {result.matches.length === 0 ? (
            <p className="text-sm text-slate-400">
              No exchange listings to match with right now. Check back when more students list books for swap.
            </p>
          ) : (
            <div className="space-y-2">
              {result.matches.map((m, i) => (
                <div
                  key={m.book._id}
                  className={`rounded-lg border p-3 ${
                    i === 0
                      ? 'border-kc-300 dark:border-kc-500/40 bg-kc-50/50 dark:bg-kc-500/5'
                      : 'border-slate-200 dark:border-navy-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {i === 0 && (
                          <span className="text-2xs font-semibold uppercase tracking-wide text-kc-500">
                            Best match
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/marketplace/${m.book._id}`}
                        className="text-sm font-medium text-navy-900 dark:text-white hover:text-kc-500"
                      >
                        {m.book.title}
                      </Link>
                      <p className="text-xs text-slate-400">offered by {m.owner.name}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                        {m.reason}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-2xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-700 text-slate-500 dark:text-slate-400">
                          KC diff: {m.kcDifference}
                        </span>
                        <span className="text-2xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-navy-700 text-slate-500 dark:text-slate-400">
                          Saves ~{m.estimatedSavings} KC
                        </span>
                        {m.breakdown.sameCollege && (
                          <span className="text-2xs px-2 py-0.5 rounded-full bg-forest-50 dark:bg-forest-500/10 text-forest-600 dark:text-forest-400">
                            Same college
                          </span>
                        )}
                      </div>
                    </div>
                    <ScoreBadge score={m.score} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}