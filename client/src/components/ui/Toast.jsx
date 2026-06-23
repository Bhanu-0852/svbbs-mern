import { createContext, useContext, useState, useCallback } from 'react'
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi'

const ToastContext = createContext(undefined)

const ICONS = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
}

const ACCENTS = {
  success: 'border-forest-500 text-forest-600 dark:text-forest-300',
  error: 'border-red-500 text-red-600 dark:text-red-300',
  info: 'border-slate-400 text-slate-600 dark:text-slate-300',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const notify = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, message, type }])
      if (duration) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || FiInfo
          return (
            <div
              key={t.id}
              className={`glass animate-slide-up rounded-lg shadow-card-hover border-l-4 ${ACCENTS[t.type]} px-4 py-3 flex items-start gap-3`}
            >
              <Icon className="mt-0.5 shrink-0" size={18} />
              <p className="text-sm text-slate-800 dark:text-slate-100 flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
              >
                <FiX size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
