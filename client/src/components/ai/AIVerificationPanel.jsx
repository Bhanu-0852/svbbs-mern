import { useState, useRef } from 'react'
import { FiZap, FiCheckCircle, FiCamera } from 'react-icons/fi'
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

const CONDITION_COLORS = {
  excellent: 'text-forest-600 dark:text-forest-400',
  good: 'text-kc-500',
  average: 'text-amber-500',
  poor: 'text-red-500',
}

export default function AIVerificationPanel({ bookId }) {
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [analysis, setAnalysis] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  async function runVerification() {
    setState('loading')
    setPreview(null)
    try {
      const { data } = await api.post(`/ai/verify-book/${bookId}`)
      setAnalysis(data.analysis)
      setState('done')
    } catch {
      setState('error')
    }
  }

  function handlePhotoClick() {
    fileInputRef.current?.click()
  }

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result
      setPreview(dataUrl)
      setState('loading')
      try {
        const { data } = await api.post('/ai/verify-photo', {
          image: dataUrl,
          mimeType: file.type,
          bookId: bookId || null,
        })
        setAnalysis(data.analysis)
        setState('done')
      } catch {
        setState('error')
      }
    }
    reader.readAsDataURL(file)
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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoSelected}
          className="hidden"
        />

        {state === 'idle' && (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Run an instant AI analysis of this book's condition — or upload a photo for a real
              computer-vision assessment of the actual copy.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="kc"
                size="sm"
                onClick={runVerification}
                disabled={!isAuthenticated}
                title={!isAuthenticated ? 'Log in to run AI verification' : undefined}
              >
                {isAuthenticated ? 'Quick verify' : 'Log in to verify'}
              </Button>
              {isAuthenticated && (
                <Button variant="outline" size="sm" onClick={handlePhotoClick}>
                  <FiCamera size={14} className="mr-1.5" />
                  Verify by photo
                </Button>
              )}
            </div>
          </>
        )}

        {state === 'loading' && (
          <div className="space-y-3">
            {preview && (
              <img
                src={preview}
                alt="Book being analyzed"
                className="w-24 h-32 object-cover rounded-md shadow-card"
              />
            )}
            <div className="space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-5/6 rounded" />
            </div>
            <p className="text-xs text-slate-400">
              {preview
                ? 'AI vision analyzing the photo — cover, spine, edges, and wear…'
                : 'Analyzing cover, binding, and page condition…'}
            </p>
          </div>
        )}

        {state === 'error' && (
          <div>
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              Couldn't run verification right now. Please try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => setState('idle')}>
              Try again
            </Button>
          </div>
        )}

        {state === 'done' && analysis && (
          <div className="animate-fade-in">
            <div className="flex items-start gap-4">
              {preview && (
                <img
                  src={preview}
                  alt="Analyzed book"
                  className="w-20 h-28 object-cover rounded-md shadow-card shrink-0"
                />
              )}
              <ScoreRing score={analysis.aiScore} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-sm font-medium text-forest-600 dark:text-forest-400 mb-1">
                  <FiCheckCircle size={14} /> Analysis complete
                </div>
                <p className="text-xs mb-1">
                  Condition:{' '}
                  <span className={`font-semibold capitalize ${CONDITION_COLORS[analysis.condition] || ''}`}>
                    {analysis.condition}
                  </span>
                  {analysis.source === 'gemini-vision' && (
                    <span className="ml-2 text-2xs text-slate-400">· AI vision</span>
                  )}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{analysis.report}</p>
                <p className="text-xs text-slate-400 mt-2">
                  Recommended value:{' '}
                  <span className="font-mono-num text-kc-500">{analysis.kcRecommendation} KC</span>
                </p>
              </div>
            </div>

            {analysis.observations && analysis.observations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-navy-600">
                <p className="text-2xs uppercase text-slate-400 mb-1.5">What the AI saw</p>
                <ul className="space-y-1">
                  {analysis.observations.map((obs, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                      <span className="text-kc-500 mt-0.5">•</span> {obs}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => setState('idle')}
              className="mt-3 text-xs text-kc-500 hover:underline"
            >
              Run another check
            </button>
          </div>
        )}
      </div>
    </div>
  )
}