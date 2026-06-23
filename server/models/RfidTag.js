import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * One RFID tag per book, registered by the vendor who physically affixes
 * it. Tracks physical custody (is this book currently on the vendor's
 * shelf or out of the building) — a separate concern from the digital
 * borrow/return flow in borrowService.js. A book can be digitally
 * 'on_loan' to a student while also being RFID 'checked_out' (it
 * physically left the shelf when handed over), and RFID 'checked_in'
 * once it physically comes back, regardless of who currently holds the
 * digital borrow record.
 *
 * Honesty note: there is no physical RFID reader hardware here — a
 * browser cannot talk to one. tagId is a realistic-looking UID (the kind
 * a real reader would emit), and the "scan" action is a manual entry
 * standing in for the hardware tap, the same honest pattern this project
 * already uses for AI verification (MOCK_AI) and payments
 * (MOCK_PAYMENTS): the full real data model and workflow are genuine,
 * only the physical sensor is simulated.
 */
const rfidTagSchema = new Schema(
  {
    tagId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, unique: true, index: true },
    vendorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['checked_in', 'checked_out'], default: 'checked_in' },
    lastScannedAt: { type: Date, default: null },
    lastScannedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

rfidTagSchema.index({ vendorId: 1, status: 1 })

export default mongoose.model('RfidTag', rfidTagSchema)
