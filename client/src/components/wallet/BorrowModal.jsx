import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Receipt from './Receipt'
import api from '../../services/api'
import { getErrorMessage } from '../../utils/apiError'

export default function BorrowModal({ open, onClose, book, walletBalance, onSuccess }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // { transaction } once confirmed

  if (!book) return null

  const kcCost = book.kcValue
  const kcUsed = Math.min(kcCost, walletBalance ?? 0)
  const cashDue = kcCost - kcUsed

  async function handleConfirm() {
    setSubmitting(true)
    setError('')
    try {
      const { data } = await api.post(`/wallet/borrow/${book._id}`)
      setResult(data)
      onSuccess?.(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not complete the borrow. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setResult(null)
    setError('')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={result ? undefined : 'Confirm borrow'}>
      {result ? (
        <div className="space-y-4">
          <Receipt transaction={result.transaction} book={book} />
          <Button variant="primary" className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img src={book.coverImage} alt="" className="w-12 h-16 object-cover rounded-sm shadow-card" />
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{book.title}</p>
              <p className="text-xs text-slate-400">{book.author}</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-navy-800 rounded-md p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Book cost</span>
              <span className="font-mono-num">{kcCost} KC</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Your balance</span>
              <span className="font-mono-num">{walletBalance ?? 0} KC</span>
            </div>
            <div className="border-t border-slate-200 dark:border-navy-600 my-1.5" />
            <div className="flex justify-between text-forest-600 dark:text-forest-400 font-medium">
              <span>Deduct from wallet</span>
              <span className="font-mono-num">− {kcUsed} KC</span>
            </div>
            {cashDue > 0 && (
              <div className="flex justify-between text-navy-900 dark:text-white font-medium">
                <span>Pay in cash (mock gateway)</span>
                <span className="font-mono-num">₹{cashDue}</span>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <Button variant="kc" className="w-full" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Processing…' : `Confirm borrow`}
          </Button>
        </div>
      )}
    </Modal>
  )
}
