import { FiClock } from 'react-icons/fi'
import { format } from 'date-fns'

const EVENT_LABELS = {
  deposited: 'Deposited into inventory',
  verified: 'AI condition verified',
  borrowed: 'Borrowed',
  returned: 'Returned',
  exchanged: 'Exchanged',
  donated: 'Donated',
  recycled: 'Recycled',
  scanned: 'QR code scanned',
  rfid_registered: 'RFID tag registered',
  rfid_checked_out: 'RFID: checked out of vendor shelf',
  rfid_checked_in: 'RFID: checked back into vendor shelf',
  sold: 'Sold',
}

export default function HistoryLedger({ history }) {
  if (!history || history.length === 0) return null

  return (
    <div>
      <h3 className="font-display text-sm font-semibold text-navy-900 dark:text-white mb-3 flex items-center gap-1.5">
        <FiClock size={14} className="text-slate-400" />
        Book history
      </h3>
      <ol className="space-y-3 border-l border-slate-200 dark:border-navy-600 pl-4">
        {history.map((h) => (
          <li key={h._id} className="relative">
            <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-kc-500" />
            <p className="text-sm text-slate-700 dark:text-slate-200">{EVENT_LABELS[h.event] || h.event}</p>
            <p className="text-xs text-slate-400">
              {format(new Date(h.createdAt), 'MMM d, yyyy')}
              {h.kcAmount ? ` · ${h.kcAmount} KC` : ''}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}
