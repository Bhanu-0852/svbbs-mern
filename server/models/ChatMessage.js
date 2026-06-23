import mongoose from 'mongoose'

const { Schema } = mongoose

/**
 * One document per message, both sides of the conversation, so a user's
 * chat history persists across sessions the same way every other
 * activity in this app does — not an ephemeral, lost-on-refresh widget.
 */
const chatMessageSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
)

chatMessageSchema.index({ userId: 1, createdAt: 1 })

export default mongoose.model('ChatMessage', chatMessageSchema)
