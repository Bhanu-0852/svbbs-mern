import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FiUser } from 'react-icons/fi'
import Navbar from '../../components/layout/Navbar'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import api, { setAccessToken } from '../../services/api'
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

  const [tab, setTab] = useState('password')

  // Password login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [needsMfa, setNeedsMfa] = useState(false)
  const [needsCaptcha, setNeedsCaptcha] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // OTP login state
  const [otpEmail, setOtpEmail] = useState('')
  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpDevCode, setOtpDevCode] = useState(null)
  const [otpError, setOtpError] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)

  // Show toast/message if arriving after verify, reset, or already-exists redirect
  const [infoMessage] = useState(location.state?.message || '')
  useState(() => {
    if (location.state?.verified) notify('Email verified! You can now log in.', 'success')
    if (location.state?.passwordReset) notify('Password reset! Log in with your new password.', 'success')
  })

  async function handlePasswordLogin(e) {
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

  async function handleSendOtp(e) {
    e.preventDefault()
    setOtpError('')
    setOtpSending(true)
    try {
      const { data } = await api.post('/auth/login/request-otp', { email: otpEmail })
      setOtpDevCode(data.devOtp || null)
      setOtpStep(true)
    } catch (err) {
      setOtpError(getErrorMessage(err))
    } finally {
      setOtpSending(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    if (otp.length !== 6) { setOtpError('Please enter the full 6-digit code.'); return }
    setOtpVerifying(true)
    setOtpError('')
    try {
      const { data } = await api.post('/auth/login/verify-otp', { email: otpEmail, otp })
      setAccessToken(data.accessToken)
      notify(`Welcome back, ${data.user?.name || otpEmail}!`, 'success')
      navigate(location.state?.from?.pathname || ROLE_HOME[data.user?.role] || '/student', { replace: true })
    } catch (err) {
      setOtpError(getErrorMessage(err))
    } finally {
      setOtpVerifying(false)
    }
  }

  function fillDemoAccount(demoEmail) {
    setEmail(demoEmail)
    setPassword(DEMO_PASSWORD)
    setNeedsMfa(false)
    setNeedsCaptcha(false)
    setError('')
    setTab('password')
  }

  function switchTab(t) {
    setTab(t)
    setError('')
    setOtpError('')
    setOtpStep(false)
    setOtp('')
    setOtpDevCode(null)
    setNeedsMfa(false)
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
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Log in to your Knowledge Credit wallet.
            </p>

            {/* Info message from redirect (e.g. already-exists) */}
            {infoMessage && (
              <p className="text-sm text-kc-500 bg-kc-50 dark:bg-kc-500/10 rounded-md px-3 py-2 mb-4">
                {infoMessage}
              </p>
            )}

            {/* Tab switcher */}
            <div className="flex rounded-md border border-slate-200 dark:border-navy-600 mb-6 overflow-hidden">
              <button
                type="button"
                onClick={() => switchTab('password')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  tab === 'password'
                    ? 'bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700'
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => switchTab('otp')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  tab === 'otp'
                    ? 'bg-navy-900 dark:bg-kc-500 text-white dark:text-navy-950'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-700'
                }`}
              >
                Email OTP
              </button>
            </div>

            {/* Password tab */}
            {tab === 'password' && (
              <form className="space-y-4" onSubmit={handlePasswordLogin}>
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
            )}

            {/* OTP tab */}
            {tab === 'otp' && (
              <>
                {!otpStep ? (
                  <form className="space-y-4" onSubmit={handleSendOtp}>
                    <p className="text-xs text-slate-400">
                      Enter your email — we'll send a 6-digit login code. No password needed.
                    </p>
                    <Input
                      label="Email"
                      type="email"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      placeholder="you@college.edu"
                      required
                      autoComplete="email"
                    />
                    {otpError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{otpError}</p>
                    )}
                    <Button type="submit" variant="primary" className="w-full" disabled={otpSending}>
                      {otpSending ? 'Sending code…' : 'Send login code'}
                    </Button>
                  </form>
                ) : (
                  <form className="space-y-4" onSubmit={handleVerifyOtp}>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Code sent to{' '}
                      <span className="font-medium text-slate-700 dark:text-slate-200">{otpEmail}</span>
                    </p>
                    {otpDevCode && (
                      <p className="text-xs text-kc-500 bg-kc-50 dark:bg-kc-500/10 rounded-md px-3 py-2">
                        Dev mode — your code is:{' '}
                        <strong className="font-mono-num text-lg tracking-widest">{otpDevCode}</strong>
                      </p>
                    )}
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d{6}"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full text-center font-mono-num text-3xl tracking-[0.5em] rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-4 py-3 text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
                      autoFocus
                    />
                    {otpError && (
                      <p className="text-sm text-red-600 dark:text-red-400">{otpError}</p>
                    )}
                    <Button type="submit" variant="kc" className="w-full" disabled={otpVerifying || otp.length < 6}>
                      {otpVerifying ? 'Verifying…' : 'Log in'}
                    </Button>
                    <button
                      type="button"
                      className="w-full text-xs text-slate-400 hover:text-kc-500"
                      onClick={() => { setOtpStep(false); setOtp(''); setOtpDevCode(null) }}
                    >
                      Use a different email
                    </button>
                  </form>
                )}
              </>
            )}

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