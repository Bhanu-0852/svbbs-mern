import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { format } from 'date-fns'
import Navbar from '../../components/layout/Navbar'
import Footer from '../../components/layout/Footer'
import BookCover from '../../components/books/BookCover'
import ConditionPhotoCarousel from '../../components/books/ConditionPhotoCarousel'
import QrCodeCard from '../../components/books/QrCodeCard'
import AIVerificationPanel from '../../components/ai/AIVerificationPanel'
import HistoryLedger from '../../components/books/HistoryLedger'
import WaitlistPanel from '../../components/books/WaitlistPanel'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { BookCoverSkeleton } from '../../components/ui/Skeleton'
import BorrowModal from '../../components/wallet/BorrowModal'
import BuyPanel from '../../components/books/BuyPanel'
import ExchangeProposePanel from '../../components/books/ExchangeProposePanel'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../hooks/useWallet'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'

const STATUS_CONFIG = {
  available: { tone: 'available', label: 'Available' },
  on_loan: { tone: 'onloan', label: 'On loan' },
  reserved: { tone: 'reserved', label: 'Reserved' },
  recycled: { tone: 'neutral', label: 'Recycled' },
  sold: { tone: 'neutral', label: 'Sold' },
}

const CATEGORY_LABELS = {
  engineering: 'Engineering',
  medical: 'Medical',
  government_exam: 'Government Exam',
  rare: 'Rare',
  arts: 'Arts',
  science: 'Science',
  general: 'General',
}

export default function BookDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const { balance, refetch: refetchWallet } = useWallet()
  const { notify } = useToast()

  const [book, setBook] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [borrowModalOpen, setBorrowModalOpen] = useState(false)

  function refetchBookDetail() {
    return api.get(`/books/${id}`).then(({ data }) => {
      setBook(data.book)
      setHistory(data.history)
    })
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .get(`/books/${id}`)
      .then(({ data }) => {
        if (cancelled) return
        setBook(data.book)
        setHistory(data.history)
      })
      .catch(() => !cancelled && setError('This book could not be found.'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id])

  // Logs a real "scanned" event into the Book History Ledger when someone
  // actually arrives via a QR scan, rather than normal browsing.
  useEffect(() => {
    if (searchParams.get('via') === 'qr') {
      api.post(`/books/${id}/scan`).catch(() => {}) // best-effort, never blocks the page
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function handleBorrowClick() {
    if (!isAuthenticated) {
      notify('Log in to borrow this book.', 'info')
      return
    }
    setBorrowModalOpen(true)
  }

  function handleBorrowSuccess() {
    refetchBookDetail()
    refetchWallet()
  }

  const [returning, setReturning] = useState(false)
  async function handleReturnClick() {
    setReturning(true)
    try {
      await api.post(`/wallet/return/${id}`)
      await refetchBookDetail()
      notify('Book returned. Thanks for keeping it in circulation.', 'success')
    } catch (err) {
      notify(err?.response?.data?.message || 'Could not return this book.', 'error')
    } finally {
      setReturning(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full grid sm:grid-cols-[260px_1fr] gap-8">
          <BookCoverSkeleton />
          <div className="space-y-3">
            <div className="skeleton h-7 w-2/3 rounded" />
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-24 w-full rounded" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-400">{error || 'Book not found.'}</p>
        </main>
        <Footer />
      </div>
    )
  }

  const statusInfo = STATUS_CONFIG[book.status] || STATUS_CONFIG.available

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white mb-6"
        >
          <FiArrowLeft size={14} /> Back to Marketplace
        </Link>

        <div className="grid sm:grid-cols-[260px_1fr] gap-10">
          {/* Hero cover */}
          <div>
            <div className="max-w-[220px]">
              <BookCover src={book.coverImage} title={book.title} author={book.author} />
            </div>
            {book.conditionPhotos?.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-400 mb-2">This exact copy</p>
                <ConditionPhotoCarousel photos={book.conditionPhotos} title={book.title} author={book.author} />
              </div>
            )}
            <div className="mt-4">
              <QrCodeCard bookId={book._id} />
            </div>
          </div>

          {/* Details + borrow panel */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {book.categoryTags?.map((tag) => (
                <Badge key={tag} tone="neutral" withDot={false}>
                  {CATEGORY_LABELS[tag] || tag}
                </Badge>
              ))}
              <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-navy-900 dark:text-white">
              {book.title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{book.author}</p>

            {book.examTags?.length > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                Relevant for: {book.examTags.join(', ')}
              </p>
            )}

            <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
              {book.description}
            </p>

            {/* Borrow / Buy / Exchange panel — which one shows depends on
                how this book was listed. A sell or exchange listing isn't
                also borrowable; donate stays on the normal borrow panel
                since kcValue is forced to 0 server-side, which already
                makes it a free borrow with zero special-cased UI needed. */}
            {book.depositMethod === 'sell' ? (
              <Card className="mt-6" padding="p-5">
                <p className="text-xs text-slate-400 mb-1">For sale</p>
                <BuyPanel
                  bookId={book._id}
                  salePrice={book.salePrice}
                  isOwner={isAuthenticated && book.ownerId?._id === user?._id}
                  isAuthenticated={isAuthenticated}
                  isSold={book.status === 'sold'}
                  onPurchased={refetchBookDetail}
                />
              </Card>
            ) : book.depositMethod === 'exchange' ? (
              <Card className="mt-6" padding="p-5">
                <p className="text-xs text-slate-400 mb-1">Listed for exchange</p>
                <ExchangeProposePanel
                  bookId={book._id}
                  isOwner={isAuthenticated && book.ownerId?._id === user?._id}
                  isAuthenticated={isAuthenticated}
                  onProposed={refetchBookDetail}
                />
              </Card>
            ) : (
              <Card className="mt-6" padding="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">Cost to borrow</p>
                    <p className="font-mono-num text-2xl font-semibold text-kc-500">{book.kcValue} KC</p>
                  </div>
                  {(() => {
                    const isCurrentHolder =
                      book.status === 'on_loan' && isAuthenticated && book.currentHolderId === user?._id

                    if (isCurrentHolder) {
                      return (
                        <Button variant="outline" onClick={handleReturnClick} disabled={returning}>
                          {returning ? 'Returning…' : 'Return this book'}
                        </Button>
                      )
                    }

                    const isReservedForMe =
                      book.status === 'reserved' && isAuthenticated && book.reservedForUserId === user?._id
                    const canBorrowNow = book.status === 'available' || isReservedForMe
                    let label = 'Currently unavailable'
                    if (book.status === 'available') label = 'Borrow this book'
                    else if (isReservedForMe) label = 'Claim your reserved copy'
                    else if (book.status === 'reserved') label = 'Reserved for another student'
                    else if (book.status === 'on_loan') label = 'Currently on loan'

                    return (
                      <Button variant="primary" onClick={handleBorrowClick} disabled={!canBorrowNow}>
                        {label}
                      </Button>
                    )
                  })()}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  {book.depositMethod === 'donate'
                    ? 'Donated by a fellow student — free to borrow, no KC or cash required.'
                    : 'If your KC balance falls short, the remainder can be paid in cash at checkout.'}
                </p>
                {isAuthenticated && book.currentHolderId === user?._id && book.dueDate && (
                  <p
                    className={`text-xs mt-1 font-medium ${
                      new Date(book.dueDate) < new Date()
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {new Date(book.dueDate) < new Date() ? 'Overdue since ' : 'Due back by '}
                    {format(new Date(book.dueDate), 'MMM d, yyyy')}
                  </p>
                )}
                {book.status === 'on_loan' && !(isAuthenticated && book.currentHolderId === user?._id) && (
                  <WaitlistPanel bookId={book._id} isAuthenticated={isAuthenticated} />
                )}
              </Card>
            )}

            <div className="mt-6">
              <AIVerificationPanel bookId={book._id} />
            </div>

            {history.length > 0 && (
              <div className="mt-8">
                <HistoryLedger history={history} />
              </div>
            )}
          </div>
        </div>
      </main>

      <BorrowModal
        open={borrowModalOpen}
        onClose={() => setBorrowModalOpen(false)}
        book={book}
        walletBalance={balance}
        onSuccess={handleBorrowSuccess}
      />

      <Footer />
    </div>
  )
}
