import { NavLink } from 'react-router-dom'

/**
 * Generic sidebar shell. Each role's dashboard page passes in its own
 * list of { to, label, icon } links — this component only handles
 * the layout, active-state styling, and accessibility.
 */
export default function Sidebar({ items = [], title }) {
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-slate-200 dark:border-navy-700 min-h-[calc(100vh-4rem)] py-6 px-3">
      {title && (
        <p className="px-3 mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {title}
        </p>
      )}
      <nav className="flex flex-col gap-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-navy-900 text-white dark:bg-kc-500 dark:text-navy-950'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700'
              }`
            }
          >
            {Icon && <Icon size={17} />}
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
