import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi'
import Navbar from '../../components/layout/Navbar'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState('verifying') // verifying | success | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided.')
      return
    }
    api
      .post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setMessage(getErrorMessage(err, 'Invalid or expired verification link.'))
      })
  }, [token])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <Card className="w-full max-w-sm text-center" padding="p-8">
          {status === 'verifying' && (
            <>
              <FiLoader className="mx-auto mb-4 animate-spin text-slate-400" size={28} />
              <p className="text-sm text-slate-500 dark:text-slate-400">Verifying your email…</p>
            </>
          )}
          {status === 'success' && (
            <>
              <span className="grid place-items-center w-14 h-14 rounded-full bg-forest-100 dark:bg-forest-700/20 text-forest-600 dark:text-forest-300 mx-auto mb-4">
                <FiCheckCircle size={24} />
              </span>
              <h1 className="font-display text-xl font-semibold text-navy-900 dark:text-white mb-2">
                Email verified
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Your account is ready. You can log in now.
              </p>
              <Button variant="primary" as={Link} to="/login" className="w-full">
                Log in
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <span className="grid place-items-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 mx-auto mb-4">
                <FiXCircle size={24} />
              </span>
              <h1 className="font-display text-xl font-semibold text-navy-900 dark:text-white mb-2">
                Verification failed
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{message}</p>
              <Button variant="outline" as={Link} to="/login" className="w-full">
                Back to login
              </Button>
            </>
          )}
        </Card>
      </main>
    </div>
  )
}
