import { Link } from 'react-router-dom'
import BookCover from './BookCover'
import Badge from '../ui/Badge'

const STATUS_CONFIG = {
  available: { tone: 'available', label: 'Available' },
  on_loan: { tone: 'onloan', label: 'On loan' },
  reserved: { tone: 'reserved', label: 'Reserved' },
  recycled: { tone: 'neutral', label: 'Recycled' },
  sold: { tone: 'neutral', label: 'Sold' },
}

export default function BookCard({ book }) {
  const statusInfo = STATUS_CONFIG[book.status] || STATUS_CONFIG.available

  let priceTag
  if (book.depositMethod === 'sell') {
    priceTag = <span className="font-mono-num text-sm font-semibold text-navy-900 dark:text-white">₹{book.salePrice}</span>
  } else if (book.depositMethod === 'exchange') {
    priceTag = <span className="text-xs font-medium text-kc-500">For exchange</span>
  } else {
    priceTag = <span className="font-mono-num text-sm font-semibold text-kc-500">{book.kcValue} KC</span>
  }

  return (
    <Link to={`/marketplace/${book._id}`} className="group block">
      <BookCover src={book.coverImage} title={book.title} author={book.author} interactive />

      <div className="mt-3 px-0.5">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-1">{book.title}</p>
        <p className="text-xs text-slate-400 line-clamp-1">{book.author}</p>

        <div className="flex items-center justify-between mt-2">
          {priceTag}
          <Badge tone={statusInfo.tone}>{statusInfo.label}</Badge>
        </div>
      </div>
    </Link>
  )
}
