import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * One document per active "device/session". The refresh token itself is
 * never stored raw — only its hash — so a leaked DB still can't be used
 * to forge sessions.
 *
 * tokenFamilyId stays constant across rotations of the *same* session.
 * If a refresh token is presented that doesn't match the current
 * refreshTokenHash for its family, that's reuse of an old token —
 * the entire family is revoked immediately (theft signal, spec §9.4).
 */
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    tokenFamilyId: { type: String, required: true, index: true },
    refreshTokenHash: { type: String, required: true },

    device: { type: String, default: 'Unknown device' },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },

    lastSeen: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },

    revoked: { type: Boolean, default: false },
    revokedReason: { type: String, default: null }, // 'logout' | 'reuse_detected' | 'password_reset' | 'manual'
  },
  { timestamps: true }
)

export default mongoose.model('Session', sessionSchema)
