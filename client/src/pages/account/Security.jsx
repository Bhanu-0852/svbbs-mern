import { useEffect, useState, useCallback } from 'react'
import { FiMonitor, FiSmartphone, FiX, FiShield, FiCopy, FiCheck } from 'react-icons/fi'
import RoleShell from '../../components/layout/RoleShell'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'
import { formatDistanceToNow } from 'date-fns'

function SessionRow({ session, onRevoke }) {
  const isMobile = /mobile|android|iphone/i.test(session.userAgent || '')
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-navy-600 last:border-0">
      <div className="flex items-center gap-3">
        <span className="grid place-items-center w-9 h-9 rounded-md bg-slate-100 dark:bg-navy-700 text-slate-500">
          {isMobile ? <FiSmartphone size={16} /> : <FiMonitor size={16} />}
        </span>
        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {session.device?.slice(0, 60) || 'Unknown device'}
          </p>
          <p className="text-xs text-slate-400">
            {session.ip || 'Unknown IP'} · last active{' '}
            {formatDistanceToNow(new Date(session.lastSeen), { addSuffix: true })}
          </p>
        </div>
      </div>
      <button
        onClick={() => onRevoke(session._id)}
        aria-label="Revoke this session"
        title="Revoke this session"
        className="text-slate-400 hover:text-red-500 p-2"
      >
        <FiX size={16} />
      </button>
    </div>
  )
}

function MfaSetupFlow({ onComplete }) {
  const [step, setStep] = useState('intro') // intro | scan | backupCodes
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
  const [secretBase32, setSecretBase32] = useState('')
  const [code, setCode] = useState('')
  const [backupCodes, setBackupCodes] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)

  async function startSetup() {
    setError('')
    try {
      const { data } = await api.post('/auth/mfa/setup')
      setQrCodeDataUrl(data.qrCodeDataUrl)
      setSecretBase32(data.secretBase32)
      setStep('scan')
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function confirmCode(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/auth/mfa/verify', { code })
      setBackupCodes(data.backupCodes)
      setStep('backupCodes')
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid code. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'intro') {
    return (
      <Button variant="primary" size="sm" onClick={startSetup}>
        Enable two-factor authentication
      </Button>
    )
  }

  if (step === 'scan') {
    return (
      <div className="mt-4 space-y-4 max-w-sm">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Scan this with an authenticator app (Google Authenticator, Authy, 1Password), or enter the
          code manually.
        </p>
        {qrCodeDataUrl && (
          <img src={qrCodeDataUrl} alt="MFA setup QR code" className="w-40 h-40 rounded-md border border-slate-200 dark:border-navy-600" />
        )}
        <p className="text-xs font-mono-num text-slate-500 dark:text-slate-400 break-all">{secretBase32}</p>
        <form onSubmit={confirmCode} className="flex items-end gap-2">
          <Input
            label="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={6}
            className="flex-1"
          />
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Verifying…' : 'Verify'}
          </Button>
        </form>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  }

  if (step === 'backupCodes') {
    return (
      <div className="mt-4 max-w-sm">
        <p className="text-sm font-medium text-forest-600 dark:text-forest-400 mb-2">
          Two-factor authentication enabled
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Save these backup codes somewhere safe. Each can be used once if you lose access to your
          authenticator app. They won't be shown again.
        </p>
        <div className="bg-slate-50 dark:bg-navy-800 rounded-md p-3 font-mono-num text-sm grid grid-cols-2 gap-1">
          {backupCodes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={copyBackupCodes}>
          {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
          {copied ? 'Copied' : 'Copy codes'}
        </Button>
        <Button variant="primary" size="sm" className="mt-3 ml-2" onClick={onComplete}>
          Done
        </Button>
      </div>
    )
  }

  return null
}

function MfaDisableFlow({ onComplete }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleDisable(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/auth/mfa/disable', { code })
      onComplete()
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid code.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleDisable} className="mt-4 flex items-end gap-2 max-w-sm">
      <Input
        label="Enter your code to disable 2FA"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={6}
        className="flex-1"
      />
      <Button type="submit" variant="danger" disabled={submitting}>
        {submitting ? 'Disabling…' : 'Disable'}
      </Button>
      {error && <p className="text-sm text-red-600 dark:text-red-400 absolute mt-12">{error}</p>}
    </form>
  )
}

export default function AccountSecurity() {
  const { user, refreshUser, logoutAllDevices } = useAuth()
  const { notify } = useToast()

  const [sessions, setSessions] = useState(null)
  const [showDisableFlow, setShowDisableFlow] = useState(false)

  const loadSessions = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/sessions')
      setSessions(data.sessions)
    } catch {
      setSessions([])
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  async function handleRevoke(sessionId) {
    try {
      await api.delete(`/auth/sessions/${sessionId}`)
      notify('Session revoked.', 'success')
      loadSessions()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    }
  }

  async function handleLogoutAll() {
    await logoutAllDevices()
  }

  return (
    <RoleShell sidebarTitle="Account">
      <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">
        Security
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Manage two-factor authentication and active sessions for {user?.email}.
      </p>

      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FiShield className="text-kc-500" size={18} />
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white">
            Two-factor authentication
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {user?.mfaEnabled
            ? 'Enabled — your account requires a code from your authenticator app at login.'
            : 'Add an extra layer of security using an authenticator app.'}
        </p>

        {user?.mfaEnabled ? (
          showDisableFlow ? (
            <MfaDisableFlow
              onComplete={() => {
                setShowDisableFlow(false)
                refreshUser()
                notify('Two-factor authentication disabled.', 'info')
              }}
            />
          ) : (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setShowDisableFlow(true)}>
              Disable two-factor authentication
            </Button>
          )
        ) : (
          <MfaSetupFlow onComplete={() => refreshUser()} />
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white">
            Active sessions
          </h2>
          <Button variant="ghost" size="sm" onClick={handleLogoutAll}>
            Log out everywhere
          </Button>
        </div>

        {sessions === null ? (
          <CardSkeleton />
        ) : sessions.length === 0 ? (
          <p className="text-sm text-slate-400">No active sessions found.</p>
        ) : (
          sessions.map((s) => <SessionRow key={s._id} session={s} onRevoke={handleRevoke} />)
        )}
      </Card>
    </RoleShell>
  )
}
