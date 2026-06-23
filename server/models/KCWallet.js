import mongoose from 'mongoose'

const { Schema } = mongoose

const kcWalletSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

export default mongoose.model('KCWallet', kcWalletSchema)
