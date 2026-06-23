import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiHome, FiAward, FiUpload, FiCheck, FiX } from 'react-icons/fi'
import RoleShell from '../../components/layout/RoleShell'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import BookCover from '../../components/books/BookCover'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'

const sidebarItems = [
  { to: '/student', label: 'Overview', icon: FiHome },
  { to: '/student/deposit', label: 'Deposit a Book', icon: FiUpload },
  { to: '/student/passport', label: 'Academic Passport', icon: FiAward },
]

const CATEGORY_OPTIONS = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'medical', label: 'Medical' },
  { value: 'government_exam', label: 'Government Exam' },
  { value: 'rare', label: 'Rare' },
  { value: 'arts', label: 'Arts' },
  { value: 'science', label: 'Science' },
  { value: 'general', label: 'General' },
]

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'average', label: 'Average' },
  { value: 'poor', label: 'Poor' },
]

const METHOD_OPTIONS = [
  { value: 'deposit', label: 'Deposit', blurb: 'Earn Knowledge Credits for it right away.' },
  { value: 'donate', label: 'Donate', blurb: 'Give it away free — no KC earned, free for anyone to borrow.' },
  { value: 'exchange', label: 'Exchange', blurb: 'List it for a direct swap with another student.' },
  { value: 'sell', label: 'Sell', blurb: 'List it for cash — a one-time outright sale, not a loan.' },
]

const STATUS_BADGE = {
  available: { tone: 'available', label: 'Available' },
  on_loan: { tone: 'onloan', label: 'On loan' },
  reserved: { tone: 'reserved', label: 'Reserved' },
  recycled: { tone: 'neutral', label: 'Recycled' },
  sold: { tone: 'neutral', label: 'Sold' },
}

function ListingRow({ book }) {
  const badge = STATUS_BADGE[book.status] || STATUS_BADGE.available
  return (
    <Link
      to={`/marketplace/${book._id}`}
      className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-navy-600 last:border-0"
    >
      <div className="w-9">
        <BookCover src={book.coverImage} title={book.title} author={book.author} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{book.title}</p>
        <p className="text-xs text-slate-400 truncate capitalize">
          {book.depositMethod}
          {book.depositMethod === 'sell' && book.salePrice ? ` · ₹${book.salePrice}` : ''}
        </p>
      </div>
      <Badge tone={badge.tone}>{badge.label}</Badge>
    </Link>
  )
}

function ProposalRow({ proposal, direction, onRespond, responding }) {
  const isReceived = direction === 'received'
  return (
    <div className="py-3 border-b border-slate-100 dark:border-navy-600 last:border-0">
      <p className="text-sm text-slate-700 dark:text-slate-200">
        {isReceived ? (
          <>
            <span className="font-medium">{proposal.proposerId?.name || 'A student'}</span> offered{' '}
            <span className="font-medium">{proposal.offeredBookId?.title}</span> for your{' '}
            <span className="font-medium">{proposal.targetBookId?.title}</span>
          </>
        ) : (
          <>
            You offered <span className="font-medium">{proposal.offeredBookId?.title}</span> for{' '}
            <span className="font-medium">{proposal.targetBookId?.title}</span>
          </>
        )}
      </p>
      <div className="flex items-center justify-between mt-1.5">
        <Badge
          tone={
            proposal.status === 'pending'
              ? 'reserved'
              : proposal.status === 'accepted'
                ? 'available'
                : 'neutral'
          }
        >
          {proposal.status}
        </Badge>
        {isReceived && proposal.status === 'pending' && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onRespond(proposal._id, false)} disabled={responding}>
              <FiX size={13} /> Decline
            </Button>
            <Button variant="primary" size="sm" onClick={() => onRespond(proposal._id, true)} disabled={responding}>
              <FiCheck size={13} /> Accept
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function StudentDeposit() {
  const navigate = useNavigate()
  const { notify } = useToast()

  const [form, setForm] = useState({
    title: '',
    author: '',
    isbn: '',
    edition: '',
    description: '',
    condition: 'good',
    categoryTags: [],
    examTags: '',
    depositMethod: 'deposit',
    salePrice: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const [listings, setListings] = useState(null)
  const [proposals, setProposals] = useState(null)
  const [responding, setResponding] = useState(false)

  const refetch = useCallback(() => {
    api.get('/books/mine').then(({ data }) => setListings(data.books)).catch(() => setListings([]))
    api
      .get('/exchanges/mine')
      .then(({ data }) => setProposals(data))
      .catch(() => setProposals({ sent: [], received: [] }))
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  function toggleCategory(value) {
    setForm((f) => ({
      ...f,
      categoryTags: f.categoryTags.includes(value)
        ? f.categoryTags.filter((c) => c !== value)
        : [...f.categoryTags, value],
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.categoryTags.length === 0) {
      notify('Pick at least one category.', 'info')
      return
    }
    if (form.depositMethod === 'sell' && !form.salePrice) {
      notify('Set a sale price.', 'info')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        author: form.author,
        isbn: form.isbn,
        edition: form.edition || undefined,
        description: form.description || undefined,
        condition: form.condition,
        categoryTags: form.categoryTags,
        examTags: form.examTags
          ? form.examTags.split(',').map((t) => t.trim()).filter(Boolean)
          : undefined,
        depositMethod: form.depositMethod,
        ...(form.depositMethod === 'sell' ? { salePrice: Number(form.salePrice) } : {}),
      }
      const { data } = await api.post('/books', payload)
      if (data.kcCredited > 0) {
        notify(`Listed! ${data.kcCredited} KC credited to your wallet.`, 'success')
      } else {
        notify('Listed successfully.', 'success')
      }
      setForm({
        title: '',
        author: '',
        isbn: '',
        edition: '',
        description: '',
        condition: 'good',
        categoryTags: [],
        examTags: '',
        depositMethod: 'deposit',
        salePrice: '',
      })
      refetch()
      navigate(`/marketplace/${data.book._id}`)
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRespond(proposalId, accept) {
    setResponding(true)
    try {
      await api.post(`/exchanges/${proposalId}/respond`, { accept })
      notify(accept ? 'Swap accepted — ownership transferred.' : 'Proposal declined.', 'success')
      refetch()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setResponding(false)
    }
  }

  const inputClass =
    'w-full rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500'

  return (
    <RoleShell sidebarItems={sidebarItems} sidebarTitle="Student">
      <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">Deposit a Book</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-2xl">
        List a book you own. Choose how — deposit it for Knowledge Credits, donate it for free, list it for a
        direct swap, or sell it outright for cash.
      </p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Author</label>
                <input
                  required
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                  ISBN (used to fetch the real cover)
                </label>
                <input
                  required
                  value={form.isbn}
                  onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                  placeholder="e.g. 9780132350884"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Edition (optional)</label>
                <input
                  value={form.edition}
                  onChange={(e) => setForm({ ...form, edition: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Description (optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Condition</label>
              <div className="flex flex-wrap gap-2">
                {CONDITION_OPTIONS.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => setForm({ ...form, condition: c.value })}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      form.condition === c.value
                        ? 'bg-navy-900 text-white dark:bg-kc-500 dark:text-navy-950'
                        : 'bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Categories</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => toggleCategory(c.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      form.categoryTags.includes(c.value)
                        ? 'bg-navy-900 text-white dark:bg-kc-500 dark:text-navy-950'
                        : 'bg-slate-100 dark:bg-navy-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                Exam tags (optional, comma-separated — e.g. UPSC, GATE)
              </label>
              <input
                value={form.examTags}
                onChange={(e) => setForm({ ...form, examTags: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">How are you listing it?</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {METHOD_OPTIONS.map((m) => (
                  <button
                    type="button"
                    key={m.value}
                    onClick={() => setForm({ ...form, depositMethod: m.value })}
                    className={`text-left p-3 rounded-md border transition-colors ${
                      form.depositMethod === m.value
                        ? 'border-kc-500 bg-kc-100/40 dark:bg-kc-500/10'
                        : 'border-slate-200 dark:border-navy-600'
                    }`}
                  >
                    <p className="text-sm font-medium text-navy-900 dark:text-white">{m.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.blurb}</p>
                  </button>
                ))}
              </div>
            </div>

            {form.depositMethod === 'sell' && (
              <div className="max-w-[200px]">
                <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Sale price (₹)</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.salePrice}
                  onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                  className={inputClass}
                />
              </div>
            )}

            <Button type="submit" variant="primary" disabled={submitting} className="w-full justify-center">
              {submitting ? 'Listing…' : 'List this book'}
            </Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-display text-base font-semibold text-navy-900 dark:text-white mb-3">My listings</h2>
            {listings === null ? (
              <CardSkeleton />
            ) : listings.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">You haven't listed any books yet.</p>
            ) : (
              listings.map((b) => <ListingRow key={b._id} book={b} />)
            )}
          </Card>

          <Card>
            <h2 className="font-display text-base font-semibold text-navy-900 dark:text-white mb-3">
              Exchange proposals
            </h2>
            {proposals === null ? (
              <CardSkeleton />
            ) : proposals.received.length === 0 && proposals.sent.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No exchange activity yet.</p>
            ) : (
              <>
                {proposals.received.map((p) => (
                  <ProposalRow
                    key={p._id}
                    proposal={p}
                    direction="received"
                    onRespond={handleRespond}
                    responding={responding}
                  />
                ))}
                {proposals.sent.map((p) => (
                  <ProposalRow key={p._id} proposal={p} direction="sent" />
                ))}
              </>
            )}
          </Card>
        </div>
      </div>
    </RoleShell>
  )
}
