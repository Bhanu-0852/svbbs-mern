import mongoose from 'mongoose'
import crypto from 'crypto'

const { Schema } = mongoose

const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },

    // 'sell' added alongside 'borrow' — a cash-only outright purchase via
    // the Sell deposit method, distinct from a KC-based borrow. Returns
    // still don't reverse payment (see README's KC model note) so they're
    // logged via BookHistory instead of a Transaction. 'exchange' isn't a
    // Transaction at all since no money or KC moves — see
    // ExchangeProposal.js instead.
    type: { type: String, enum: ['borrow', 'sell'], required: true },

    kcCost: { type: Number, required: true }, // the book's full KC value at time of transaction
    kcUsed: { type: Number, required: true }, // how much of that was covered by wallet balance
    cashDue: { type: Number, required: true }, // remainder paid via the (mock) payment gateway

    status: { type: String, enum: ['completed', 'refunded'], default: 'completed' },

    // Set only when this borrow was fully funded by a CSR Sponsored Book
    // grant (see csrService.sponsorBook) — kcUsed and cashDue are both 0
    // in that case, since the student's own wallet was never touched.
    // Kept as its own field rather than overloading kcUsed/cashDue so
    // "who actually paid" stays an honest, traceable fact, not inferred.
    sponsoredBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    receiptNumber: { type: String, required: true, unique: true },
  },
  { timestamps: true }
)

transactionSchema.pre('validate', function setReceiptNumber(next) {
  if (!this.receiptNumber) {
    this.receiptNumber = `SVBBS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`
  }
  next()
})

export default mongoose.model('Transaction', transactionSchema)
