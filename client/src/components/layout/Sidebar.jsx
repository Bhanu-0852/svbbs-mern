import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { FiHelpCircle, FiX } from 'react-icons/fi'
import api from '../../services/api'

/**
 * Generic sidebar shell. Each role's dashboard page passes in its own
 * list of { to, label, icon } links. Each item also gets a contextual
 * "?" help button that asks the AI to explain that feature.
 */
export default function Sidebar({ items = [], title }) {
  const [helpFor, setHelpFor] = useState(null)
  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)

  async function showHelp(label) {
    if (helpFor === label) {
      setHelpFor(null)
      return
    }
    setHelpFor(label)
    setExplanation('')
    setLoading(true)
    try {
      const { data } = await api.post('/chatbot/explain', { feature: label })
      setExplanation(data.explanation)
    } catch {
      setExplanation('Could not load help right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-slate-200 dark:border-navy-700 min-h-[calc(100vh-4rem)] py-6 px-3">
      {title && (
        <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {title}
        </p>
      )}
      <nav className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <div key={to} className="relative group">
            <div className="flex items-center">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex-1 flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-navy-900 text-white dark:bg-kc-500 dark:text-navy-950'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700'
                  }`
                }
              >
                {Icon && <Icon size={17} />}
                {label}
              </NavLink>
              <button
                onClick={() => showHelp(label)}
                className={`ml-1 p-1.5 rounded-md text-slate-400 hover:text-kc-500 hover:bg-slate-100 dark:hover:bg-navy-700 transition-colors ${
                  helpFor === label ? 'text-kc-500' : 'opacity-0 group-hover:opacity-100'
                }`}
                aria-label={`What is ${label}?`}
                title={`What is ${label}?`}
              >
                <FiHelpCircle size={15} />
              </button>
            </div>

            {helpFor === label && (
              <div className="mt-1 mb-1 mx-1 p-3 rounded-md bg-kc-50 dark:bg-kc-500/10 border border-kc-200 dark:border-kc-500/20 animate-fade-in">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-2xs font-semibold uppercase tracking-wide text-kc-600 dark:text-kc-400">
                    AI Guide
                  </span>
                  <button
                    onClick={() => setHelpFor(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label="Close help"
                  >
                    <FiX size={13} />
                  </button>
                </div>
                {loading ? (
                  <div className="mt-2 space-y-1.5">
                    <div className="skeleton h-3 w-full rounded" />
                    <div className="skeleton h-3 w-4/5 rounded" />
                  </div>
                ) : (
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {explanation}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}