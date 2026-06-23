import { FiCheckCircle } from 'react-icons/fi'
import { format } from 'date-fns'

export default function Receipt({ transaction, book }) {
  if (!transaction) return null

  return (
    <div className="border border-slate-200 dark:border-navy-600 rounded-lg overflow-hidden">
      <div className="bg-forest-600 text-white px-5 py-4 flex items-center gap-2">
        <FiCheckCircle size={18} />
        <p className="font-display font-semibold">Borrow confirmed</p>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <p className="text-xs text-slate-400">Receipt</p>
          <p className="font-mono-num text-sm text-slate-700 dark:text-slate-200">{transaction.receiptNumber}</p>
        </div>

        <div className="flex items-center gap-3">
          {book?.coverImage && (
            <img src={book.coverImage} alt="" className="w-10 h-14 object-cover rounded-sm shadow-card" />
          )}
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{book?.title}</p>
            <p className="text-xs text-slate-400">{book?.author}</p>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-navy-600 pt-3 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Book cost</span>
            <span className="font-mono-num">{transaction.kcCost} KC</span>
          </div>
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Paid with Knowledge Credits</span>
            <span className="font-mono-num text-kc-500">− {transaction.kcUsed} KC</span>
          </div>
          {transaction.cashDue > 0 && (
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Paid in cash</span>
              <span className="font-mono-num">₹{transaction.cashDue}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-navy-900 dark:text-white pt-1.5 border-t border-slate-100 dark:border-navy-600">
            <span>Total</span>
            <span className="font-mono-num">
              {transaction.kcUsed} KC{transaction.cashDue > 0 ? ` + ₹${transaction.cashDue}` : ''}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-400">
          {format(new Date(transaction.createdAt || Date.now()), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>
    </div>
  )
}
