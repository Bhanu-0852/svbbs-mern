import { useId } from 'react'

export default function Input({ label, error, hint, className = '', ...rest }) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined
  const hintId = hint ? `${id}-hint` : undefined

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        className={`
          w-full rounded-md border px-3.5 py-2.5 text-sm
          bg-white dark:bg-navy-800
          text-slate-900 dark:text-slate-100
          placeholder:text-slate-400
          border-slate-300 dark:border-navy-500
          focus:border-kc-500 focus:ring-1 focus:ring-kc-500
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
        `}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
