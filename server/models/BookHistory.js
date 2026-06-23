import mongoose from 'mongoose'

const { Schema } = mongoose

const bookHistorySchema = new Schema(
  {
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    event: {
      type: String,
      enum: [
        'deposited',
        'verified',
        'borrowed',
        'returned',
        'exchanged',
        'donated',
        'recycled',
        'scanned',
        'rfid_registered',
        'rfid_checked_out',
        'rfid_checked_in',
        'sold',
      ],
      required: true,
    },
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    toUserId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    condition: { type: String, default: null },
    kcAmount: { type: Number, default: null },
    // Generic cash value tied to this event — currently only used for
    // 'recycled' (the scrap value a recycler is credited), kept generic
    // rather than recycling-specific since other cash-bearing events
    // could reuse it later instead of each needing their own field.
    cashAmount: { type: Number, default: null },
    note: { type: String, default: null },
  },
  { timestamps: true }
)

bookHistorySchema.index({ bookId: 1, createdAt: 1 })

export default mongoose.model('BookHistory', bookHistorySchema)
