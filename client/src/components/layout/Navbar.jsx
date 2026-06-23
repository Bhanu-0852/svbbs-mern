import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FiBookOpen, FiMenu, FiShield, FiLogOut, FiUser } from 'react-icons/fi'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './NotificationBell'
import Button from '../ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../hooks/useWallet'
import KCBalance from '../wallet/KCBalance'

const NAV_LINKS = [
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/exam-hub', label: 'Exam Hub' },
  { to: '/sustainability', label: 'Sustainability' },
]

const ROLE_HOME = {
  student: '/student',
  vendor: '/vendor',
  college_admin: '/college',
  super_admin: '/superadmin',
  recycler: '/recycler',
  csr_sponsor: '/csr',
  parent: '/parent',
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const { balance, loading: walletLoading } = useWallet()
  const navigate = useNavigate()

  async function handleLogout() {
    setAccountOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 glass">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to={isAuthenticated && user ? (ROLE_HOME[user.role] || '/') : '/'} className="flex items-center gap-2 font-display text-lg font-semibold text-navy-900 dark:text-white">
          <span className="grid place-items-center w-8 h-8 rounded-md bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950">
            <FiBookOpen size={16} />
          </span>
          SVBBS
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'text-navy-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-2">
              <NotificationBell />
              <KCBalance balance={balance} loading={walletLoading} />
              <div className="relative">
              <button
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700"
                aria-haspopup="true"
                aria-expanded={accountOpen}
              >
                <span className="grid place-items-center w-6 h-6 rounded-full bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950 text-xs font-semibold">
                  {user?.name?.[0]?.toUpperCase() || <FiUser size={12} />}
                </span>
                {user?.name?.split(' ')[0]}
              </button>
              {accountOpen && (
                <div className="absolute right-0 mt-2 w-48 glass rounded-md shadow-card-hover py-1.5 animate-fade-in">
                  <Link
                    to="/account/security"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700"
                  >
                    <FiShield size={15} /> Security
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700"
                  >
                    <FiLogOut size={15} /> Log out
                  </button>
                </div>
              )}
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="sm" as={Link} to="/login">
                Log in
              </Button>
              <Button variant="primary" size="sm" as={Link} to="/register">
                Get started
              </Button>
            </div>
          )}
          <button
            className="md:hidden text-slate-600 dark:text-slate-300"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <FiMenu size={22} />
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden glass border-t border-slate-200/50 dark:border-navy-600/50 px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-sm font-medium rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700"
            >
              {link.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <>
              <Link
                to="/account/security"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm font-medium rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700"
              >
                Security
              </Link>
              <button
                onClick={handleLogout}
                className="text-left px-3 py-2 text-sm font-medium rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-700"
              >
                Log out
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Button variant="ghost" size="sm" className="flex-1" as={Link} to="/login">
                Log in
              </Button>
              <Button variant="primary" size="sm" className="flex-1" as={Link} to="/register">
                Get started
              </Button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
