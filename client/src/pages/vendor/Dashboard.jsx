import { useEffect, useState } from 'react'
import { FiHome, FiRadio } from 'react-icons/fi'
import RoleShell from '../../components/layout/RoleShell'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import BookCover from '../../components/books/BookCover'
import { CardSkeleton } from '../../components/ui/Skeleton'
import api from '../../services/api'
import { format } from 'date-fns'

const sidebarItems = [
  { to: '/vendor', label: 'Overview', icon: FiHome },
  { to: '/vendor/rfid', label: 'RFID Status', icon: FiRadio },
]

const STATUS_CONFIG = {
  available: { tone: 'available', label: 'Available' },
  on_loan: { tone: 'onloan', label: 'On loan' },
  reserved: { tone: 'reserved', label: 'Reserved' },
  recycled: { tone: 'neutral', label: 'Recycled' },
}

function InventoryRow({ book }) {
  const statusInfo = STATUS_CONFIG[book.status] || STATUS_CONFIG.available
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-navy-600 last:border-0">
      <div className="w-9">
        <BookCover src={book.coverImage} title={book.title} author={book.author} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{book.title}</p>
        <p className="text-xs text-slate-400 truncate">
          {book.status === 'on_loan' && book.currentHolderId
            ? `Borrowed by ${book.currentHolderId.name}`
            : book.author}
        </p>
      </div>
      <span className="font-mono-num text-sm text-kc-500 shrink-0">{book.kcValue} KC</span>
      <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
    </div>
  )
}

function TransactionRow({ tx }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-navy-600 last:border-0 text-sm">
      <div>
        <p className="text-slate-700 dark:text-slate-200">{tx.bookId?.title || 'Unknown book'}</p>
        <p className="text-xs text-slate-400">
          {tx.userId?.name || 'Unknown borrower'} · {format(new Date(tx.createdAt), 'MMM d, yyyy')}
        </p>
      </div>
      <span className="font-mono-num text-forest-600 dark:text-forest-400">
        +{tx.kcUsed} KC{tx.cashDue > 0 ? ` + ₹${tx.cashDue}` : ''}
      </span>
    </div>
  )
}

export default function VendorDashboard() {
  const [stats, setStats] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [transactions, setTransactions] = useState(null)

  useEffect(() => {
    api.get('/vendor/stats').then(({ data }) => setStats(data.stats)).catch(() => setStats(null))
    api.get('/vendor/inventory').then(({ data }) => setInventory(data.books)).catch(() => setInventory([]))
    api.get('/vendor/transactions').then(({ data }) => setTransactions(data.transactions)).catch(() => setTransactions([]))
  }, [])

  return (
    <RoleShell sidebarItems={sidebarItems} sidebarTitle="Vendor">
      <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">
        Vendor Overview
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Your inventory, who's borrowing what, and your real revenue.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {stats === null ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Total Books</p>
              <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">{stats.totalBooks}</p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Available</p>
              <p className="font-display text-2xl font-semibold text-forest-600 dark:text-forest-400">{stats.available}</p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">On Loan</p>
              <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">{stats.onLoan}</p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">KC Earned</p>
              <p className="font-display text-2xl font-semibold text-kc-500">{stats.totalKcEarned}</p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Cash Earned</p>
              <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">₹{stats.totalCashEarned}</p>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-3">Inventory</h2>
          {inventory === null ? (
            <CardSkeleton />
          ) : inventory.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No books in inventory yet.</p>
          ) : (
            inventory.map((b) => <InventoryRow key={b._id} book={b} />)
          )}
        </Card>

        <Card>
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-3">
            Recent transactions
          </h2>
          {transactions === null ? (
            <CardSkeleton />
          ) : transactions.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No transactions yet.</p>
          ) : (
            transactions.slice(0, 8).map((tx) => <TransactionRow key={tx._id} tx={tx} />)
          )}
        </Card>
      </div>
    </RoleShell>
  )
}
