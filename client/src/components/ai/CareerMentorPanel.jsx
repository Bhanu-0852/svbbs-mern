import { useState } from 'react'
import { FiCompass, FiZap, FiCheckCircle, FiBookOpen, FiAward, FiCode, FiTarget } from 'react-icons/fi'
import api from '../../services/api'

function Section({ icon: Icon, title, items }) {
  if (!items?.length) return null
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={14} className="text-kc-500" />
        <h4 className="text-sm font-semibold text-navy-900 dark:text-white">{title}</h4>
      </div>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <span className="text-kc-500 mt-0.5 shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function CareerMentorPanel() {
  const [state, setState] = useState('idle') // idle | loading | done | error
  const [roadmap, setRoadmap] = useState(null)

  async function generate() {
    setState('loading')
    try {
      const { data } = await api.get('/career-mentor/roadmap')
      setRoadmap(data)
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="rounded-xl p-px bg-gradient-kc">
      <div className="rounded-[11px] bg-white dark:bg-navy-800 p-5">
        <div className="flex items-center gap-2 mb-1">
          <FiCompass className="text-kc-500" size={16} />
          <h3 className="font-display text-base font-semibold text-navy-900 dark:text-white">
            AI Career Mentor
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          A personalized roadmap grounded in the books you've actually borrowed and your department.
        </p>

        {state === 'idle' && (
          <button
            onClick={generate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950 text-sm font-medium"
          >
            <FiZap size={14} /> Generate my roadmap
          </button>
        )}

        {state === 'loading' && (
          <div className="space-y-3">
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-20 w-full rounded" />
            <p className="text-xs text-slate-400">Analyzing your reading history and building a plan…</p>
          </div>
        )}

        {state === 'error' && (
          <div>
            <p className="text-sm text-red-500 mb-2">Couldn't generate your roadmap right now.</p>
            <button onClick={() => setState('idle')} className="text-xs text-kc-500 hover:underline">
              Try again
            </button>
          </div>
        )}

        {state === 'done' && roadmap && (
          <div className="animate-fade-in space-y-5">
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-navy-900 rounded-lg p-3">
              {roadmap.summary}
            </p>

            <div className="grid sm:grid-cols-2 gap-5">
              <Section icon={FiCheckCircle} title="Skills to build" items={roadmap.requiredSkills} />
              <Section icon={FiBookOpen} title="Recommended reading" items={roadmap.recommendedBooks} />
              <Section icon={FiAward} title="Certifications" items={roadmap.certifications} />
              <Section icon={FiCode} title="Projects to build" items={roadmap.projects} />
              <Section icon={FiTarget} title="Interview topics" items={roadmap.interviewTopics} />
              <Section icon={FiCompass} title="Weekly goals" items={roadmap.weeklyGoals} />
            </div>

            <button onClick={() => setState('idle')} className="text-xs text-kc-500 hover:underline">
              Regenerate
            </button>
          </div>
        )}
      </div>
    </div>
  )
}