import mongoose from 'mongoose'

const { Schema } = mongoose

// Each record is one grant from a CSR sponsor to a student — either a
// general KC top-up (bookId is null, see csrService.grantToStudent), or
// a Sponsored Book: a specific book chosen and fully paid for by the
// sponsor (bookId is set, see csrService.sponsorBook). The latter is a
// genuinely different action, not just a labeled cash grant — it
// performs a real borrow on the student's behalf that never touches
// their own wallet at all, recorded via the real borrow infrastructure
// (a real Transaction with sponsoredBy set, a real BookHistory entry),
// not a parallel system. This collection stays the audit trail of who
// funded whom either way.
const sponsorshipSchema = new Schema(
  {
    sponsorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', default: null },
    kcAmount: { type: Number, required: true, min: 1 },
    note: { type: String, default: '' },
  },
  { timestamps: true }
)

sponsorshipSchema.index({ sponsorId: 1, createdAt: -1 })

export default mongoose.model('Sponsorship', sponsorshipSchema)
