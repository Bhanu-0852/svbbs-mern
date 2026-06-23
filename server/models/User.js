import mongoose from 'mongoose'

const { Schema } = mongoose

const ROLES = ['student', 'vendor', 'college_admin', 'super_admin', 'recycler', 'csr_sponsor', 'parent']

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },

    role: { type: String, enum: ROLES, default: 'student', index: true },

    collegeId: { type: Schema.Types.ObjectId, ref: 'College', default: null },
    collegeVerified: { type: Boolean, default: false }, // college-email / ID verification badge (feature #5)

    parentId: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // for student->parent linkage

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }, // false = suspended by Super Admin

    kcWalletId: { type: Schema.Types.ObjectId, ref: 'KCWallet', default: null },
    badges: [{ type: String }],

    mfaEnabled: { type: Boolean, default: false },

    // Account lockout state (spec §9.2)
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },

    lastLoginAt: { type: Date, default: null },
    lastLoginIp: { type: String, default: null },

    // Single-use, expiring, hashed tokens (spec §9.5) — never store raw tokens
    emailVerificationTokenHash: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },

    passwordResetTokenHash: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
  },
  { timestamps: true }
)

userSchema.index({ role: 1, collegeId: 1 })

export const ROLE_VALUES = ROLES
export default mongoose.model('User', userSchema)
