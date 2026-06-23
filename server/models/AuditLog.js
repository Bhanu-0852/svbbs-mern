import mongoose from 'mongoose'

const { Schema } = mongoose

const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // null for unauthenticated events (e.g. failed login)
    action: { type: String, required: true, index: true }, // e.g. 'auth.login', 'auth.password_reset', 'session.revoke'
    target: { type: String, default: null }, // free-form description of what was acted on
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} }, // never put secrets/tokens/passwords in here
  },
  { timestamps: true }
)

auditLogSchema.index({ actorId: 1, createdAt: -1 })

export default mongoose.model('AuditLog', auditLogSchema)
