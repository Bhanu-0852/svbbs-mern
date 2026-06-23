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

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Step 2: OTP entry + new password
  const [step, setStep] = useState('email') // 'email' | 'otp'
  const [devOtp, setDevOtp] = useState(null)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [otpError, setOtpError] = useState('')

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/auth/forgot-password', { email })
      setDevOtp(data.devOtp || null)
      setStep('otp')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault()
    setOtpError('')
    if (otp.length !== 6) {
      setOtpError('Please enter the full 6-digit code.')
      return
    }
    const policyCheck = checkPasswordStrength(newPassword)
    if (!policyCheck.isValid) {
      setOtpError('Please meet all the password requirements.')
      return
    }
    setResetting(true)
    try {
      await api.post('/auth/reset-password', { otp, email, password: newPassword })
      navigate('/login', { state: { passwordReset: true } })
    } catch (err) {
      setOtpError(getErrorMessage(err))
    } finally {
      setResetting(false)
    }
  }

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-sm" padding="p-8">
            <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">
              Reset your password
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Enter the code sent to{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span> and
              choose a new password.
              {devOtp && (
                <span className="block mt-2 text-xs text-kc-500 bg-kc-50 dark:bg-kc-500/10 rounded-md px-3 py-2">
                  Dev mode — your code is: <strong className="font-mono-num text-lg tracking-widest">{devOtp}</strong>
                </span>
              )}
            </p>
            <form className="space-y-4" onSubmit={handleResetSubmit}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                  6-digit code
                </label>
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
              </div>
              <div>
                <Input
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
                <PasswordStrengthMeter password={newPassword} />
              </div>
              {otpError && (
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">{otpError}</p>
              )}
              <Button
                type="submit"
                variant="kc"
                className="w-full"
                disabled={resetting || otp.length < 6}
              >
                {resetting ? 'Resetting…' : 'Reset password'}
              </Button>
              <button
                type="button"
                className="w-full text-xs text-slate-400 hover:text-kc-500"
                onClick={async () => {
                  try {
                    const { data } = await api.post('/auth/forgot-password', { email })
                    if (data.devOtp) setDevOtp(data.devOtp)
                    setOtpError('')
                  } catch {
                    setOtpError('Failed to resend. Please wait a moment and try again.')
                  }
                }}
              >
                Resend code
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
            Forgot password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Enter your email and we'll send a 6-digit reset code.
          </p>
          <form className="space-y-4" onSubmit={handleEmailSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu"
              required
              autoComplete="email"
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
            )}
            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting ? 'Sending code…' : 'Send reset code'}
            </Button>
          </form>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-6 text-center">
            <Link to="/login" className="text-kc-500 font-medium hover:underline">
              Back to login
            </Link>
          </p>
        </Card>
      </main>
    </div>
  )
}
