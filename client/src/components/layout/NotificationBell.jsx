import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiBell } from 'react-icons/fi'
import api from '../../services/api'
import { format } from 'date-fns'

const POLL_INTERVAL_MS = 30000

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  function load() {
    api
      .get('/notifications')
      .then(({ data }) => {
        setNotifications(data.notifications)
        setUnreadCount(data.unreadCount)
      })
      .catch(() => {})
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  async function handleOpen() {
    setOpen((o) => !o)
  }

  async function handleClickNotification(n) {
    if (!n.read) {
      try {
        await api.post(`/notifications/${n._id}/read`)
        setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)))
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        // non-critical — closing the dropdown is still fine even if the read-receipt fails
      }
    }
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Notifications"
      >
        <FiBell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid place-items-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 glass rounded-md shadow-card-hover py-1.5 animate-fade-in max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-3 py-5 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">No notifications yet</p>
              <p className="text-xs text-slate-400">Borrow a book, join a waitlist, or check your due dates — notifications appear here automatically.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <Link
                key={n._id}
                to={n.link || '#'}
                onClick={() => handleClickNotification(n)}
                className={`block px-3 py-2.5 text-sm border-b border-slate-100 dark:border-navy-600 last:border-0 hover:bg-slate-50 dark:hover:bg-navy-700 ${
                  n.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-100'
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-kc-500 shrink-0" />}
                  <div className={!n.read ? '' : 'pl-3.5'}>
                    <p>{n.message}</p>
                    <p className="text-2xs text-slate-400 mt-0.5">
                      {format(new Date(n.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
