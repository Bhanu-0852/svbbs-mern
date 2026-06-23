import { FiSun, FiMonitor, FiMoon } from 'react-icons/fi'
import { useTheme } from '../../context/ThemeContext'

const OPTIONS = [
  { value: 'light', icon: FiSun, label: 'Light theme' },
  { value: 'system', icon: FiMonitor, label: 'System theme' },
  { value: 'dark', icon: FiMoon, label: 'Dark theme' },
]

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex items-center gap-0.5 p-1 rounded-full bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-600"
    >
      {OPTIONS.map(({ value, icon: Icon, label }) => {
        const active = theme === value
        return (
          <button
            key={value}
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={`
              p-1.5 rounded-full transition-all duration-150
              ${active
                ? 'bg-white dark:bg-navy-600 shadow-sm text-kc-500'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}
            `}
          >
            <Icon size={15} />
          </button>
        )
      })}
    </div>
  )
}
