import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../../components/layout/Navbar'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import PasswordStrengthMeter from '../../components/auth/PasswordStrengthMeter'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'
import { checkPasswordStrength } from '../../utils/validators'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { notify } = useToast()

  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!checkPasswordStrength(password).isValid) {
      setError('Please meet all the password requirements below.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      notify('Password reset. Please log in.', 'success')
      navigate('/login', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <Card className="w-full max-w-sm text-center" padding="p-8">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              This reset link is missing its token. Please request a new one.
            </p>
            <Button variant="outline" as={Link} to="/forgot-password" className="w-full">
              Request new link
            </Button>
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
            Choose a new password
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            You'll be logged out of all other devices once this is done.
          </p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <Input
                label="New password"
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

            <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
              {submitting ? 'Resetting…' : 'Reset password'}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  )
}
