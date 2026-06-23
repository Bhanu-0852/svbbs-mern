import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * One entry per (user, book) waitlist signup. Queue order is just
 * createdAt ascending among 'waiting' entries — no separate position
 * field to keep in sync.
 *
 * Deliberately no automatic time-based expiry on 'ready' entries: a
 * background scheduler to expire stale reservations would be fragile to
 * build and verify honestly in this environment. Instead, a reservation
 * holds until the student either claims it (borrows normally) or
 * explicitly releases it, which cascades to the next person in line.
 * This is a simpler, fully-synchronous model that's still real — not a
 * time-based system with the expiry logic faked or skipped.
 */
const waitlistEntrySchema = new Schema(
  {
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['waiting', 'ready', 'claimed', 'cancelled'], default: 'waiting' },
  },
  { timestamps: true }
)

waitlistEntrySchema.index({ bookId: 1, status: 1, createdAt: 1 })
waitlistEntrySchema.index({ bookId: 1, userId: 1, status: 1 })

export default mongoose.model('WaitlistEntry', waitlistEntrySchema)
