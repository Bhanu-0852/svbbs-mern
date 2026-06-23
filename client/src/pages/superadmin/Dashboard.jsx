import { useEffect, useState } from 'react'
import { FiHome, FiShield } from 'react-icons/fi'
import RoleShell from '../../components/layout/RoleShell'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { CardSkeleton } from '../../components/ui/Skeleton'
import api from '../../services/api'
import { format } from 'date-fns'

const sidebarItems = [{ to: '/superadmin', label: 'Overview', icon: FiHome }]

// Maps the real action strings written by logAudit() across the codebase
// to human-readable labels. Falls back to a formatted version of the raw
// string for anything not explicitly mapped, so a new event type never
// renders as a blank or broken row.
const ACTION_LABELS = {
  'auth.register': 'Account registered',
  'auth.email_verified': 'Email verified',
  'auth.login': 'Logged in',
  'auth.login_failed': 'Failed login attempt',
  'auth.refresh_reuse_detected': 'Refresh token reuse detected',
  'auth.password_reset_requested': 'Password reset requested',
  'auth.password_reset': 'Password reset completed',
  'auth.mfa_enabled': 'Two-factor authentication enabled',
  'auth.mfa_disabled': 'Two-factor authentication disabled',
  'wallet.borrow': 'Borrowed a book',
  'wallet.return': 'Returned a book',
}

const ALERT_ACTIONS = new Set(['auth.login_failed', 'auth.refresh_reuse_detected'])

function formatFallbackLabel(action) {
  return action.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const ROLE_LABELS = {
  student: 'Student',
  vendor: 'Vendor',
  college_admin: 'College Admin',
  super_admin: 'Super Admin',
  recycler: 'Recycler',
  csr_sponsor: 'CSR Sponsor',
  parent: 'Parent',
}

function AuditLogRow({ log }) {
  const isAlert = ALERT_ACTIONS.has(log.action)
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-navy-600 last:border-0 text-sm">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAlert ? 'bg-red-500' : 'bg-forest-500'}`} />
      <div className="flex-1 min-w-0">
        <p className={`truncate ${isAlert ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
          {ACTION_LABELS[log.action] || formatFallbackLabel(log.action)}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {log.actorId?.name || 'Unauthenticated'} {log.actorId?.role ? `· ${ROLE_LABELS[log.actorId.role]}` : ''}
        </p>
      </div>
      <span className="text-xs text-slate-400 shrink-0">{format(new Date(log.createdAt), 'MMM d, h:mm a')}</span>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState(null)
  const [fraud, setFraud] = useState(null)

  useEffect(() => {
    api.get('/superadmin/stats').then(({ data }) => setStats(data.stats)).catch(() => setStats(null))
    api.get('/superadmin/audit-logs').then(({ data }) => setLogs(data.logs)).catch(() => setLogs([]))
    api.get('/superadmin/fraud-signals').then(({ data }) => setFraud(data)).catch(() => setFraud(null))
  }, [])

  return (
    <RoleShell sidebarItems={sidebarItems} sidebarTitle="Super Admin">
      <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">
        Platform Overview
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Real platform-wide numbers and a live feed of every security-relevant event.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats === null ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Total Users</p>
              <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">{stats.totalUsers}</p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Total Books</p>
              <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">{stats.totalBooks}</p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Total Transactions</p>
              <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">{stats.totalTransactions}</p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Locked Accounts</p>
              <p className={`font-display text-2xl font-semibold ${stats.lockedAccounts > 0 ? 'text-red-500' : 'text-forest-600 dark:text-forest-400'}`}>
                {stats.lockedAccounts}
              </p>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-3">KC Economy</h2>
          {stats === null ? (
            <CardSkeleton />
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">KC in circulation</span>
                <span className="font-mono-num text-kc-500">{stats.kcInCirculation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total KC spent (all time)</span>
                <span className="font-mono-num text-navy-900 dark:text-white">{stats.totalKcSpentAllTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total cash collected</span>
                <span className="font-mono-num text-navy-900 dark:text-white">₹{stats.totalCashCollected}</span>
              </div>
              <div className="border-t border-slate-100 dark:border-navy-600 pt-3 mt-3">
                <p className="text-2xs text-slate-400 uppercase mb-2">Users by role</p>
                {Object.entries(stats.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex justify-between text-xs py-0.5">
                    <span className="text-slate-500 dark:text-slate-400">{ROLE_LABELS[role] || role}</span>
                    <span className="font-mono-num text-slate-700 dark:text-slate-200">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-3">
            Recent Activity
          </h2>
          {logs === null ? (
            <CardSkeleton />
          ) : logs.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No activity logged yet.</p>
          ) : (
            logs.map((log) => <AuditLogRow key={log._id} log={log} />)
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-1 flex items-center gap-1.5">
          <FiShield size={16} className="text-kc-500" /> Fraud Detection
        </h2>
        <p className="text-xs text-slate-400 mb-4 max-w-2xl">
          Real heuristics over login attempts and transaction activity from the last {fraud?.windowHours ?? 24}{' '}
          hours — not a trained model. Each rule is explainable and reviewable; nothing here auto-blocks anyone.
        </p>

        {fraud === null ? (
          <CardSkeleton />
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-2xs text-slate-400 uppercase mb-2">
                Suspicious IPs <span className="normal-case text-slate-400">(credential stuffing)</span>
              </p>
              {fraud.suspiciousIps.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">Nothing flagged.</p>
              ) : (
                fraud.suspiciousIps.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-navy-600 last:border-0 text-sm">
                    <span className="font-mono-num text-xs text-slate-700 dark:text-slate-200">{s.ip}</span>
                    <Badge tone="danger" withDot={false}>
                      {s.distinctEmails} accounts
                    </Badge>
                  </div>
                ))
              )}
            </div>

            <div>
              <p className="text-2xs text-slate-400 uppercase mb-2">
                Accounts under attack <span className="normal-case text-slate-400">(early warning)</span>
              </p>
              {fraud.accountsUnderAttack.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">Nothing flagged.</p>
              ) : (
                fraud.accountsUnderAttack.map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-navy-600 last:border-0 text-sm">
                    <span className="text-slate-700 dark:text-slate-200 truncate">{a.email}</span>
                    <Badge tone="danger" withDot={false}>
                      {a.failCount} fails
                    </Badge>
                  </div>
                ))
              )}
            </div>

            <div>
              <p className="text-2xs text-slate-400 uppercase mb-2">
                High-velocity users <span className="normal-case text-slate-400">(unusual activity)</span>
              </p>
              {fraud.highVelocityUsers.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">Nothing flagged.</p>
              ) : (
                fraud.highVelocityUsers.map((u, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-navy-600 last:border-0 text-sm">
                    <span className="text-slate-700 dark:text-slate-200 truncate">{u.name}</span>
                    <Badge tone="danger" withDot={false}>
                      {u.transactionCount} txns
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </Card>
    </RoleShell>
  )
}
