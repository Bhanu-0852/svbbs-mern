import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import PasswordStrengthMeter from '../../components/auth/PasswordStrengthMeter'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'
import { checkPasswordStrength } from '../../utils/validators'

export default function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // OTP verification step
  const [otpStep, setOtpStep] = useState(false)
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [otpError, setOtpError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!checkPasswordStrength(password).isValid) {
      setError('Please meet all the password requirements below.')
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role: 'student' })

      // Already-verified account tried to register again — send them to login
      if (data.alreadyExists) {
        navigate('/login', { state: { message: 'That email is already registered. Log in instead.' } })
        return
      }

      setDevOtp(data.devOtp || null)
      setOtpStep(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    setOtpError('')
    if (otp.length !== 6) {
      setOtpError('Please enter the full 6-digit code.')
      return
    }
    setVerifying(true)
    try {
      await api.post('/auth/verify-email', { otp, email })
      navigate('/login', { state: { verified: true } })
    } catch (err) {
      setOtpError(getErrorMessage(err))
    } finally {
      setVerifying(false)
    }
  }

  if (otpStep) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-sm" padding="p-8">
            <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">
              Verify your email
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Enter the 6-digit code sent to{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>.
              {devOtp && (
                <span className="block mt-2 text-xs text-kc-500 bg-kc-50 dark:bg-kc-500/10 rounded-md px-3 py-2">
                  Dev mode — your code is:{' '}
                  <strong className="font-mono-num text-lg tracking-widest">{devOtp}</strong>
                </span>
              )}
            </p>
            <form className="space-y-4" onSubmit={handleVerifyOtp}>
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
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {otpError}
                </p>
              )}
              <Button type="submit" variant="kc" className="w-full" disabled={verifying || otp.length < 6}>
                {verifying ? 'Verifying…' : 'Verify & continue'}
              </Button>
              <button
                type="button"
                className="w-full text-xs text-slate-400 hover:text-kc-500"
                onClick={async () => {
                  try {
                    const { data } = await api.post('/auth/resend-verification', { email })
                    if (data.devOtp) setDevOtp(data.devOtp)
                    setOtpError('')
                  } catch {
                    setOtpError('Failed to resend. Please wait a moment and try again.')
                  }
                }}
              >
                Didn't receive it? Resend code
              </button>
            </form>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-sm" padding="p-8">
          <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">
            Create your account
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Start earning Knowledge Credits today.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              autoComplete="name"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu"
              required
              autoComplete="email"
            />
            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
              />
              <PasswordStrengthMeter password={password} />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" variant="kc" className="w-full" disabled={submitting}>
              {submitting ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400 mt-6 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-kc-500 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </Card>
      </main>
    </div>
  )
}