import { useState } from 'react'
import { FiTag } from 'react-icons/fi'
import Button from '../ui/Button'
import { useToast } from '../ui/Toast'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'

export default function BuyPanel({ bookId, salePrice, isOwner, isAuthenticated, isSold, onPurchased }) {
  const { notify } = useToast()
  const [buying, setBuying] = useState(false)

  async function handleBuy() {
    if (!isAuthenticated) {
      notify('Log in to buy this book.', 'info')
      return
    }
    setBuying(true)
    try {
      await api.post(`/books/${bookId}/buy`)
      notify('Purchase complete — the book is yours.', 'success')
      onPurchased?.()
    } catch (err) {
      notify(getErrorMessage(err), 'error')
    } finally {
      setBuying(false)
    }
  }

  return (
    <div className="rounded-md border border-slate-200 dark:border-navy-600 px-3 py-2.5 mt-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <FiTag size={13} /> Cash-only sale — not borrowable
        </div>
        <span className="font-mono-num text-lg font-semibold text-navy-900 dark:text-white">₹{salePrice}</span>
      </div>
      <Button
        className="mt-3 w-full justify-center"
        variant="primary"
        onClick={handleBuy}
        disabled={buying || isOwner || isSold}
      >
        {isSold ? 'Already sold' : isOwner ? 'This is your listing' : buying ? 'Processing…' : `Buy for ₹${salePrice}`}
      </Button>
    </div>
  )
}
