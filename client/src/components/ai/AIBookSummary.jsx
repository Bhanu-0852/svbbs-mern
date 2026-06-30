import { useState } from 'react'
import { FiZap, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import api from '../../services/api'

export default function AIBookSummary({ title, author, categoryTags, description }) {
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [summary, setSummary] = useState('')
  const [open, setOpen] = useState(false)

  async function handleClick() {
    if (state === 'done') {
      setOpen((o) => !o)
      return
    }
    setState('loading')
    setOpen(true)
    try {
      const { data } = await api.post('/ai/book-summary', {
        title,
        author,
        categoryTags,
        description,
      })
      setSummary(data.summary)
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={handleClick}
        disabled={state === 'loading'}
        className="flex items-center gap-1.5 text-xs font-medium text-kc-500 hover:text-kc-600 disabled:opacity-50 transition-colors"
      >
        <FiZap size={13} />
        {state === 'idle' && 'Generate AI summary'}
        {state === 'loading' && 'Generating summary…'}
        {state === 'done' && (
          <>
            AI summary
            {open ? <FiChevronUp size={13} /> : <FiChevronDown size={13} />}
          </>
        )}
        {state === 'error' && 'Try AI summary again'}
      </button>

      {state === 'loading' && (
        <div className="mt-2 space-y-1.5">
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-5/6 rounded" />
          <div className="skeleton h-3 w-4/5 rounded" />
        </div>
      )}

      {state === 'error' && (
        <p className="mt-1.5 text-xs text-red-500">
          Couldn't generate a summary right now. Try again in a moment.
        </p>
      )}

      {state === 'done' && open && summary && (
        <div className="mt-2 rounded-lg bg-kc-50 dark:bg-kc-500/10 border border-kc-100 dark:border-kc-500/20 px-4 py-3 animate-fade-in">
          <p className="text-2xs font-semibold uppercase tracking-wide text-kc-500 mb-1.5">
            AI Summary
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {summary}
          </p>
        </div>
      )}
    </div>
  )
}