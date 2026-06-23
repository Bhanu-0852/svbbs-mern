import mongoose from 'mongoose'

const { Schema } = mongoose

const loginAttemptSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    ip: { type: String, required: true, index: true },
    success: { type: Boolean, required: true },
    reason: { type: String, default: null }, // 'bad_password' | 'locked' | 'unverified' | 'mfa_failed' | 'success'
    userAgent: { type: String, default: null },
  },
  { timestamps: true }
)

// Auto-expire attempts after 30 days — only recent history matters for lockout/anomaly checks
loginAttemptSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })

export default mongoose.model('LoginAttempt', loginAttemptSchema)
