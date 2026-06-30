import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FiHome, FiAward, FiCompass, FiUpload, FiCloud } from 'react-icons/fi'
import RoleShell from '../../components/layout/RoleShell'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import BookCover from '../../components/books/BookCover'
import BookCard from '../../components/books/BookCard'
import { CardSkeleton, BookCoverSkeleton } from '../../components/ui/Skeleton'
import { useWallet } from '../../hooks/useWallet'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'
import { format } from 'date-fns'

const CATEGORY_LABELS = {
  engineering: 'Engineering',
  medical: 'Medical',
  government_exam: 'Government Exam',
  rare: 'Rare',
  arts: 'Arts',
  science: 'Science',
  general: 'General',
}

const sidebarItems = [
  { to: '/student', label: 'Overview', icon: FiHome },
  { to: '/student/deposit', label: 'Deposit a Book', icon: FiUpload },
  { to: '/student/passport', label: 'Academic Passport', icon: FiAward },
]

function dueDateInfo(dueDate) {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const now = new Date()
  const daysLeft = Math.ceil((due - now) / (24 * 60 * 60 * 1000))
  if (daysLeft < 0) {
    return { label: `Overdue since ${format(due, 'MMM d')}`, className: 'text-red-600 dark:text-red-400' }
  }
  if (daysLeft <= 2) {
    return { label: `Due ${format(due, 'MMM d')}`, className: 'text-amber-600 dark:text-amber-400' }
  }
  return { label: `Due ${format(due, 'MMM d')}`, className: 'text-slate-400' }
}

function MyBookRow({ book, onReturned }) {
  const { notify } = useToast()
  const [returning, setReturning] = useState(false)
  const due = dueDateInfo(book.dueDate)

  async function handleReturn() {
    setReturning(true)
    try {
      await api.post(`/wallet/return/${book._id}`)
      notify('Book returned. Thanks for keeping it in circulation.', 'success')
      onReturned(book._id)
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setReturning(false)
    }
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-navy-600 last:border-0">
      <div className="w-10">
        <BookCover src={book.coverImage} title={book.title} author={book.author} size="sm" />
      </div>
      <div className="flex-1">
        <Link to={`/marketplace/${book._id}`} className="text-sm font-medium text-slate-800 dark:text-slate-100 hover:text-kc-500">
          {book.title}
        </Link>
        <p className="text-xs text-slate-400">{book.author}</p>
        {due && <p className={`text-2xs mt-0.5 ${due.className}`}>{due.label}</p>}
      </div>
      <Button variant="outline" size="sm" onClick={handleReturn} disabled={returning}>
        {returning ? 'Returning…' : 'Return'}
      </Button>
    </div>
  )
}

function TransactionRow({ tx }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-navy-600 last:border-0 text-sm">
      <div>
        <p className="text-slate-700 dark:text-slate-200">{tx.bookId?.title || 'Unknown book'}</p>
        <p className="text-xs text-slate-400">{format(new Date(tx.createdAt), 'MMM d, yyyy')}</p>
      </div>
      {tx.sponsoredBy ? (
        <span className="font-mono-num text-forest-600 dark:text-forest-400 text-xs font-medium">
          Sponsored — no cost
        </span>
      ) : (
        <span className="font-mono-num text-kc-500">
          − {tx.kcUsed} KC{tx.cashDue > 0 ? ` + ₹${tx.cashDue}` : ''}
        </span>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  const { balance, loading: walletLoading, refetch: refetchWallet } = useWallet()
  const { user } = useAuth()

  // Critical data — loaded immediately on mount
  const [myBooks, setMyBooks] = useState(null)
  const [transactions, setTransactions] = useState(null)

  // Non-critical data — deferred so the page feels instant
  const [recommendations, setRecommendations] = useState(null)
  const [recBasis, setRecBasis] = useState(null)
  const [aiInsight, setAiInsight] = useState(null)
  const [impact, setImpact] = useState(null)

  const loadMyBooks = useCallback(() => {
    api.get('/wallet/my-books').then(({ data }) => setMyBooks(data.books)).catch(() => setMyBooks([]))
  }, [])

  useEffect(() => {
    // Phase 1 — load the two most important panels immediately
    loadMyBooks()
    api
      .get('/wallet/transactions')
      .then(({ data }) => setTransactions(data.transactions))
      .catch(() => setTransactions([]))

    // Phase 2 — defer slow/non-critical calls by 800ms so the page
    // paints quickly first, then fills in the rest. Recommendations
    // and sustainability are useful but not what a student lands here
    // specifically to see — borrowed books and balance are.
    const deferred = setTimeout(() => {
      api
        .get('/books/recommendations')
        .then(({ data }) => {
          setRecommendations(data.recommendations)
          setRecBasis(data.basis)
          setAiInsight(data.aiInsight || null)
        })
        .catch(() => setRecommendations([]))

      api
        .get('/sustainability/me')
        .then(({ data }) => setImpact(data.stats))
        .catch(() => setImpact(null))
    }, 800)

    return () => clearTimeout(deferred)
  }, [loadMyBooks])

  function handleReturned(bookId) {
    setMyBooks((prev) => prev.filter((b) => b._id !== bookId))
    refetchWallet()
  }

  return (
    <RoleShell sidebarItems={sidebarItems} sidebarTitle="Student">
      <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">
        Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Here's your Knowledge Credits wallet and borrowed books.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card tilt3d padding="p-4">
          <p className="text-2xs text-slate-400 uppercase mb-1">KC Balance</p>
          <p className="font-display text-3xl font-semibold text-kc-500">
            {walletLoading ? '—' : balance ?? 0}
          </p>
          {!walletLoading && (balance === 0 || balance === null) && (
            <p className="text-xs text-slate-400 mt-1">Deposit a book to earn KC</p>
          )}
        </Card>
        <Card tilt3d padding="p-4">
          <p className="text-2xs text-slate-400 uppercase mb-1">Books borrowed</p>
          <p className="font-display text-3xl font-semibold text-navy-900 dark:text-white">
            {myBooks === null ? '—' : myBooks.length}
          </p>
        </Card>
        <Card tilt3d padding="p-4">
          <p className="text-2xs text-slate-400 uppercase mb-1">Transactions</p>
          <p className="font-display text-3xl font-semibold text-navy-900 dark:text-white">
            {transactions === null ? '—' : transactions.length}
          </p>
        </Card>
      </div>

      {/* New user onboarding */}
      {!walletLoading && balance === 0 && myBooks?.length === 0 && transactions?.length === 0 && (
        <Card className="mb-6 border-kc-200 dark:border-kc-500/30 bg-kc-50/50 dark:bg-kc-500/5">
          <h2 className="font-display text-base font-semibold text-navy-900 dark:text-white mb-2">
            Get started — earn your first Knowledge Credits
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            You have 0 KC right now. Here's how to earn some:
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <Button variant="kc" size="sm" as={Link} to="/student/deposit">
              Deposit a book
            </Button>
            <Button variant="outline" size="sm" as={Link} to="/marketplace">
              Browse books
            </Button>
            <Button variant="outline" size="sm" as={Link} to="/exam-hub">
              Exam Hub
            </Button>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-3">
            My Books
          </h2>
          {myBooks === null ? (
            <CardSkeleton />
          ) : myBooks.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-slate-400 mb-3">You haven't borrowed any books yet.</p>
              <Button variant="outline" size="sm" as={Link} to="/marketplace">
                Browse the Marketplace
              </Button>
            </div>
          ) : (
            myBooks.map((b) => <MyBookRow key={b._id} book={b} onReturned={handleReturned} />)
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
            transactions.slice(0, 6).map((tx) => <TransactionRow key={tx._id} tx={tx} />)
          )}
        </Card>
      </div>

      {/* Deferred section — loads 800ms after mount */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <FiCompass size={16} className="text-kc-500" />
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white">
            Recommended for you
          </h2>
        </div>

        {/* AI Insight card — shows the personalized reading narrative */}
        {aiInsight && recBasis === 'borrow_history' && (
          <div className="mb-4 rounded-xl p-px bg-gradient-kc">
            <div className="rounded-[11px] bg-white dark:bg-navy-800 px-4 py-3 flex items-start gap-3">
              <span className="text-kc-500 mt-0.5 shrink-0">✦</span>
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wide text-kc-500 mb-1">
                  AI Reading Insight
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {aiInsight.insight}
                </p>
              </div>
            </div>
          </div>
        )}

        {recommendations === null ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <BookCoverSkeleton key={i} />)}
          </div>
        ) : recommendations.length === 0 ? (
          <p className="text-sm text-slate-400">No recommendations available right now.</p>
        ) : (
          <>
            {/* Only show the plain caption when there's no AI insight to show */}
            {!(aiInsight && recBasis === 'borrow_history') && (
              <p className="text-xs text-slate-400 mb-4">
                {recBasis === 'borrow_history'
                  ? "Based on the categories you've borrowed most."
                  : "Here's what's newest on the shelf."}
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommendations.map(({ book, matchedCategories }) => (
                <div key={book._id}>
                  <BookCard book={book} />
                  {matchedCategories.length > 0 && (
                    <p className="text-2xs text-slate-400 mt-1 px-0.5">
                      {matchedCategories.map((c) => CATEGORY_LABELS[c] || c).join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <FiCloud size={16} className="text-forest-500" />
          <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white">
            Your Sustainability Impact
          </h2>
        </div>
        {impact === null ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Books Reused</p>
              <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">
                {impact.booksReused}
              </p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Trees Saved</p>
              <p className="font-display text-2xl font-semibold text-forest-600 dark:text-forest-400">
                {impact.treesSaved}
              </p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">CO₂ Reduced</p>
              <p className="font-display text-2xl font-semibold text-forest-600 dark:text-forest-400">
                {impact.co2ReducedKg} kg
              </p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Money Saved</p>
              <p className="font-display text-2xl font-semibold text-kc-500">₹{impact.moneySaved}</p>
            </Card>
          </div>
        )}
      </div>
    </RoleShell>
  )
}