import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * A direct, 1:1 swap proposal: someone offers one of their own available
 * books in exchange for a book listed with depositMethod 'exchange'. No
 * money or KC moves — this is a pure ownership swap, accept/decline by
 * the book's current owner. Deliberately simple (no matching algorithm,
 * no multi-way trades) — a real, working two-sided proposal flow rather
 * than an over-engineered one.
 */
const exchangeProposalSchema = new Schema(
  {
    targetBookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    offeredBookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    proposerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetOwnerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
)

exchangeProposalSchema.index({ targetBookId: 1, status: 1 })

export default mongoose.model('ExchangeProposal', exchangeProposalSchema)
