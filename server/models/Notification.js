import mongoose from 'mongoose'

const { Schema } = mongoose

const notificationSchema = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['waitlist_ready', 'due_soon', 'overdue', 'welcome'],
      required: true,
    },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', default: null },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
)

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)