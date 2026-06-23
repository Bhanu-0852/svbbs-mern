import mongoose from 'mongoose'

const { Schema } = mongoose

const mfaSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    // Encrypted at the application layer before storage (see utils/crypto.js)
    totpSecretEncrypted: { type: String, required: true },

    // Hashed (bcrypt) single-use recovery codes — never stored or shown again after generation
    backupCodeHashes: [{ type: String }],

    enabled: { type: Boolean, default: false },
    enabledAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export default mongoose.model('MFA', mfaSchema)
