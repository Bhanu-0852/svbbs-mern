import mongoose from 'mongoose'

const { Schema } = mongoose

// Same shape and mechanics as Sponsorship.js (granting tops up the real
// KCWallet, so this is the audit trail of who funded whom, not a separate
// currency) — kept as its own model rather than reusing Sponsorship,
// because a college scholarship and a CSR grant are genuinely different
// concepts with different eligibility rules (a college admin can only
// fund their OWN college's students; a CSR sponsor can fund any student)
// and keeping them separate means each role's "how much have I given"
// stats stay clean even if a student receives both kinds of funding.
const scholarshipSchema = new Schema(
  {
    collegeAdminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    collegeId: { type: Schema.Types.ObjectId, ref: 'College', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    kcAmount: { type: Number, required: true, min: 1 },
    note: { type: String, default: '' },
  },
  { timestamps: true }
)

scholarshipSchema.index({ collegeId: 1, createdAt: -1 })

export default mongoose.model('Scholarship', scholarshipSchema)
