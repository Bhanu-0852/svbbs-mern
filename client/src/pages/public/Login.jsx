import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiUser } from 'react-icons/fi'
import Navbar from '../../components/layout/Navbar'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import { getErrorMessage, requiresCaptcha, requiresMfa } from '../../utils/apiError'

const ROLE_HOME = {
  student: '/student',
  vendor: '/vendor',
  college_admin: '/college',
  super_admin: '/superadmin',
  recycler: '/recycler',
  csr_sponsor: '/csr',
  parent: '/parent',
}

const DEMO_ACCOUNTS = [
  { label: 'Student', sublabel: 'Asha Verma · 500 KC', email: 'student@svbbs.demo' },
  { label: 'Vendor', email: 'vendor@svbbs.demo' },
  { label: 'Super Admin', email: 'admin@svbbs.demo' },
  { label: 'Recycler', email: 'recycler@svbbs.demo' },
  { label: 'College Admin', sublabel: 'NIT-CBE', email: 'college@svbbs.demo' },
  { label: 'CSR Sponsor', email: 'csr@svbbs.demo' },
  { label: 'Parent', sublabel: 'Rajesh Verma', email: 'parent@svbbs.demo' },
]
const DEMO_PASSWORD = 'Demo!Pass123'

export default function Login() {
  const { login } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [needsMfa, setNeedsMfa] = useState(false)
  const [needsCaptcha, setNeedsCaptcha] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [infoMessage] = useState(location.state?.message || '')

  useState(() => {
    if (location.state?.verified) notify('Email verified! You can now log in.', 'success')
    if (location.state?.passwordReset) notify('Password reset! Log in with your new password.', 'success')
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const user = await login({ email, password, mfaCode: needsMfa ? mfaCode : undefined })
      notify(`Welcome back, ${user.name}.`, 'success')
      navigate(location.state?.from?.pathname || ROLE_HOME[user.role] || '/', { replace: true })
    } catch (err) {
      if (requiresMfa(err)) {
        setNeedsMfa(true)
        setError('Enter your two-factor authentication code to continue.')
      } else if (requiresCaptcha(err)) {
        setNeedsCaptcha(true)
        setError(getErrorMessage(err))
      } else {
        setError(getErrorMessage(err, 'Invalid email or password.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  function fillDemoAccount(demoEmail) {
    setEmail(demoEmail)
    setPassword(DEMO_PASSWORD)
    setNeedsMfa(false)
    setNeedsCaptcha(false)
    setError('')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl grid sm:grid-cols-2 gap-6 items-start">
          <Card padding="p-8">
            <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Log in to your Knowledge Credit wallet.
            </p>

            {infoMessage && (
              <p className="text-sm text-kc-500 bg-kc-50 dark:bg-kc-500/10 rounded-md px-3 py-2 mb-4">
                {infoMessage}
              </p>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              {!needsMfa && (
                <button type="button" onClick={() => setNeedsMfa(true)} className="text-xs text-slate-400 hover:text-kc-500">
                  I have a two-factor authentication code
                </button>
              )}
              {needsMfa && (
                <Input
                  label="Authentication code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="6-digit code"
                  maxLength={6}
                  hint="From your authenticator app, or a backup code."
                />
              )}
              {needsCaptcha && (
                <p className="text-xs text-kc-500 bg-kc-50 dark:bg-kc-500/10 rounded-md px-3 py-2">
                  Multiple failed attempts detected. Please wait a moment before trying again.
                </p>
              )}
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
              )}
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-slate-400 hover:text-kc-500">
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                {submitting ? 'Logging in…' : 'Log in'}
              </Button>
            </form>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-6 text-center">
              New here?{' '}
              <Link to="/register" className="text-kc-500 font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </Card>

          <Card padding="p-6">
            <h2 className="font-display text-sm font-semibold text-navy-900 dark:text-white mb-1">
              Demo accounts
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              All seeded by <code className="font-mono-num">npm run seed</code>, password:{' '}
              <code className="font-mono-num">{DEMO_PASSWORD}</code>. Click one to fill the form.
            </p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemoAccount(acc.email)}
                  className={`w-full flex items-center gap-2.5 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    email === acc.email
                      ? 'bg-kc-50 dark:bg-kc-500/10 text-kc-500'
                      : 'hover:bg-slate-100 dark:hover:bg-navy-600 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <FiUser size={14} className="shrink-0 opacity-60" />
                  <span className="flex-1 min-w-0">
                    <span className="font-medium">{acc.label}</span>
                    {acc.sublabel && (
                      <span className="text-xs text-slate-400"> · {acc.sublabel}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}