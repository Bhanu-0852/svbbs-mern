import { useState } from 'react'
import { FiZap, FiCheckCircle } from 'react-icons/fi'
import Button from '../ui/Button'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'

function ScoreRing({ score }) {
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-16 h-16 shrink-0">
      <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" strokeWidth="5" className="stroke-slate-200 dark:stroke-navy-600" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          className="stroke-kc-500 transition-all duration-700 ease-smooth"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono-num text-sm font-semibold text-navy-900 dark:text-white">{score}</span>
      </div>
    </div>
  )
}

export default function AIVerificationPanel({ bookId }) {
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [analysis, setAnalysis] = useState(null)

  async function runVerification() {
    setState('loading')
    try {
      const { data } = await api.post(`/ai/verify-book/${bookId}`)
      setAnalysis(data.analysis)
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="rounded-xl p-px bg-gradient-kc">
      <div className="rounded-[11px] bg-white dark:bg-navy-800 p-5">
        <div className="flex items-center gap-2 mb-3">
          <FiZap className="text-kc-500" size={16} />
          <h3 className="font-display text-sm font-semibold text-navy-900 dark:text-white">
            AI Condition Verification
          </h3>
        </div>

        {state === 'idle' && (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Run an instant AI analysis of this book's authenticity and physical condition.
            </p>
            <Button
              variant="kc"
              size="sm"
              onClick={runVerification}
              disabled={!isAuthenticated}
              title={!isAuthenticated ? 'Log in to run AI verification' : undefined}
            >
              {isAuthenticated ? 'Run verification' : 'Log in to verify'}
            </Button>
          </>
        )}

        {state === 'loading' && (
          <div className="space-y-2">
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <p className="text-xs text-slate-400 mt-2">Analyzing cover, binding, and page condition…</p>
          </div>
        )}

        {state === 'error' && (
          <p className="text-sm text-red-600 dark:text-red-400">
            Couldn't run verification right now. Please try again.
          </p>
        )}

        {state === 'done' && analysis && (
          <div className="flex items-start gap-4 animate-fade-in">
            <ScoreRing score={analysis.aiScore} />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-forest-600 dark:text-forest-400 mb-1">
                <FiCheckCircle size={14} /> Authenticity verified
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{analysis.report}</p>
              <p className="text-xs text-slate-400 mt-2">
                Recommended value: <span className="font-mono-num text-kc-500">{analysis.kcRecommendation} KC</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
