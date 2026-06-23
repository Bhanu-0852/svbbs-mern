import { FiSmartphone } from 'react-icons/fi'
import { API_BASE_URL } from '../../services/api'

export default function QrCodeCard({ bookId }) {
  return (
    <div className="border border-slate-200 dark:border-navy-600 rounded-lg p-4 flex items-center gap-4">
      <img
        src={`${API_BASE_URL}/books/${bookId}/qrcode`}
        alt="QR code linking to this book"
        className="w-16 h-16 shrink-0 rounded-md border border-slate-100 dark:border-navy-600 bg-white"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
          <FiSmartphone size={14} className="text-kc-500 shrink-0" /> Scan to open
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Point a phone camera here to open this exact book page.
        </p>
      </div>
    </div>
  )
}
