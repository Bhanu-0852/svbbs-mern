import { useEffect, useState, useCallback } from 'react'
import { FiHome, FiRadio, FiPlus, FiRefreshCw } from 'react-icons/fi'
import RoleShell from '../../components/layout/RoleShell'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import BookCover from '../../components/books/BookCover'
import { CardSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'
import { format } from 'date-fns'

const sidebarItems = [
  { to: '/vendor', label: 'Overview', icon: FiHome },
  { to: '/vendor/rfid', label: 'RFID Status', icon: FiRadio },
]

function TagRow({ tag }) {
  const checkedIn = tag.status === 'checked_in'
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-navy-600 last:border-0">
      <div className="w-9">
        <BookCover src={tag.bookId?.coverImage} title={tag.bookId?.title} author={tag.bookId?.author} size="sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
          {tag.bookId?.title || 'Unknown book'}
        </p>
        <p className="text-xs font-mono-num text-slate-400 truncate">{tag.tagId}</p>
      </div>
      <div className="text-right shrink-0">
        <Badge tone={checkedIn ? 'available' : 'onloan'}>{checkedIn ? 'On the shelf' : 'Checked out'}</Badge>
        {tag.lastScannedAt && (
          <p className="text-2xs text-slate-400 mt-1">Last scan {format(new Date(tag.lastScannedAt), 'MMM d, h:mm a')}</p>
        )}
      </div>
    </div>
  )
}

export default function VendorRfid() {
  const { notify } = useToast()
  const [stats, setStats] = useState(null)
  const [tags, setTags] = useState(null)
  const [untaggedBooks, setUntaggedBooks] = useState([])
  const [selectedBookId, setSelectedBookId] = useState('')
  const [scanTagId, setScanTagId] = useState('')
  const [registering, setRegistering] = useState(false)
  const [scanning, setScanning] = useState(false)

  const refetch = useCallback(() => {
    api.get('/rfid/stats').then(({ data }) => setStats(data.stats)).catch(() => setStats(null))
    Promise.all([api.get('/rfid/tags'), api.get('/vendor/inventory')])
      .then(([tagsRes, invRes]) => {
        setTags(tagsRes.data.tags)
        const taggedBookIds = new Set(tagsRes.data.tags.map((t) => t.bookId?._id))
        setUntaggedBooks(invRes.data.books.filter((b) => !taggedBookIds.has(b._id)))
      })
      .catch(() => {
        setTags([])
        setUntaggedBooks([])
      })
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function handleRegister() {
    if (!selectedBookId) {
      notify('Pick a book to tag first.', 'info')
      return
    }
    setRegistering(true)
    try {
      const { data } = await api.post('/rfid/register', { bookId: selectedBookId })
      notify(`Tag ${data.tag.tagId} registered.`, 'success')
      setSelectedBookId('')
      refetch()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setRegistering(false)
    }
  }

  async function handleScan() {
    if (!scanTagId.trim()) {
      notify('Enter a tag ID to simulate a scan.', 'info')
      return
    }
    setScanning(true)
    try {
      const { data } = await api.post('/rfid/scan', { tagId: scanTagId.trim() })
      const verb = data.tag.status === 'checked_out' ? 'checked out' : 'checked in'
      notify(`${data.tag.bookId.title} ${verb}.`, 'success')
      setScanTagId('')
      refetch()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setScanning(false)
    }
  }

  return (
    <RoleShell sidebarItems={sidebarItems} sidebarTitle="Vendor">
      <h1 className="font-display text-2xl font-semibold text-navy-900 dark:text-white mb-1">RFID Status</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 max-w-2xl">
        Track which books are physically on your shelf versus checked out, using RFID tags.
      </p>
      <p className="text-xs text-slate-400 mb-6 max-w-2xl">
        There's no physical RFID reader connected here — a browser can't talk to one. Registering a tag mints a
        realistic tag ID the same way a fresh physical tag arrives pre-printed with a UID, and "simulate a scan"
        stands in for tapping that tag against a reader. Everything else — the tag records, the check-in/check-out
        history, the audit log — is the real workflow a physical reader would drive.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-8 max-w-xl">
        {stats === null ? (
          Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          <>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Tagged Books</p>
              <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">{stats.totalTagged}</p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">On Shelf</p>
              <p className="font-display text-2xl font-semibold text-forest-600 dark:text-forest-400">
                {stats.checkedIn}
              </p>
            </Card>
            <Card tilt3d padding="p-4">
              <p className="text-2xs text-slate-400 uppercase mb-1">Checked Out</p>
              <p className="font-display text-2xl font-semibold text-navy-900 dark:text-white">{stats.checkedOut}</p>
            </Card>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="font-display text-base font-semibold text-navy-900 dark:text-white mb-3 flex items-center gap-1.5">
            <FiPlus size={15} className="text-slate-400" /> Register a tag
          </h2>
          <p className="text-xs text-slate-400 mb-3">Attach a new RFID tag to a book that doesn't have one yet.</p>
          <div className="flex gap-2">
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="flex-1 min-w-0 rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
            >
              <option value="">{untaggedBooks.length === 0 ? 'No untagged books' : 'Select a book…'}</option>
              {untaggedBooks.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.title}
                </option>
              ))}
            </select>
            <Button variant="primary" onClick={handleRegister} disabled={registering || !selectedBookId}>
              {registering ? 'Registering…' : 'Register'}
            </Button>
          </div>
        </Card>

        <Card>
          <h2 className="font-display text-base font-semibold text-navy-900 dark:text-white mb-3 flex items-center gap-1.5">
            <FiRefreshCw size={15} className="text-slate-400" /> Simulate a scan
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            Enter a registered tag ID to flip it between on-shelf and checked-out — standing in for a reader tap.
          </p>
          <div className="flex gap-2">
            <input
              value={scanTagId}
              onChange={(e) => setScanTagId(e.target.value)}
              placeholder="e.g. E280-1160-6000…"
              className="flex-1 min-w-0 rounded-md border border-slate-300 dark:border-navy-500 bg-white dark:bg-navy-800 px-3 py-2.5 text-sm font-mono-num text-slate-900 dark:text-slate-100 focus:border-kc-500 focus:ring-1 focus:ring-kc-500"
            />
            <Button variant="primary" onClick={handleScan} disabled={scanning}>
              {scanning ? 'Scanning…' : 'Scan'}
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="font-display text-lg font-semibold text-navy-900 dark:text-white mb-3">Tagged inventory</h2>
        {tags === null ? (
          <CardSkeleton />
        ) : tags.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">No books have an RFID tag registered yet.</p>
        ) : (
          tags.map((t) => <TagRow key={t._id} tag={t} />)
        )}
      </Card>
    </RoleShell>
  )
}
