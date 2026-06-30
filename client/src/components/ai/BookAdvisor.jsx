import { useState } from 'react'
import { FiMessageSquare, FiSend } from 'react-icons/fi'
import api from '../../services/api'

const SUGGESTED = [
  'Is this good for beginners?',
  'Will this help me prepare for my exam?',
  'What topics does it cover?',
]

export default function BookAdvisor({ title, author, categoryTags, examTags, description }) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [asked, setAsked] = useState(false)

  async function ask(q) {
    const query = (q || question).trim()
    if (!query || loading) return
    setQuestion(query)
    setLoading(true)
    setAsked(true)
    setAnswer('')
    try {
      const { data } = await api.post('/ai/ask-book', {
        question: query,
        title,
        author,
        categoryTags,
        examTags,
        description,
      })
      setAnswer(data.answer)
    } catch {
      setAnswer("Couldn't get an answer right now. Please try again in a moment.")
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    ask()
  }

  return (
    <div className="mt-6 rounded-xl border border-slate-200 dark:border-navy-600 p-5 bg-white dark:bg-navy-800">
      <div className="flex items-center gap-2 mb-1">
        <FiMessageSquare className="text-kc-500" size={16} />
        <h3 className="font-display text-sm font-semibold text-navy-900 dark:text-white">
          Ask about this book
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        Not sure if it's right for you? Ask the AI advisor anything about this book.
      </p>

      {/* Suggested questions */}
      {!asked && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="text-xs px-2.5 py-1.5 rounded-full bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300 hover:bg-kc-50 dark:hover:bg-kc-500/10 hover:text-kc-600 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Will this help with GATE preparation?"
          className="flex-1 min-w-0 rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="shrink-0 grid place-items-center w-9 h-9 rounded-md bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950 disabled:opacity-40"
          aria-label="Ask"
        >
          <FiSend size={15} />
        </button>
      </form>

      {asked && (
        <div className="mt-3">
          {loading ? (
            <div className="space-y-1.5">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-5/6 rounded" />
              <div className="skeleton h-3 w-4/6 rounded" />
            </div>
          ) : (
            answer && (
              <div className="rounded-lg bg-kc-50 dark:bg-kc-500/10 border border-kc-100 dark:border-kc-500/20 px-4 py-3 animate-fade-in">
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{answer}</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}