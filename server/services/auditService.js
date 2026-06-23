import AuditLog from '../models/AuditLog.js'

export async function logAudit({ actorId = null, action, target = null, req, metadata = {} }) {
  try {
    await AuditLog.create({
      actorId,
      action,
      target,
      ip: req?.ip || null,
      userAgent: req?.headers?.['user-agent'] || null,
      metadata, // caller must never pass passwords/tokens/OTPs here
    })
  } catch (err) {
    // Audit logging must never break the request it's logging
    console.error('[audit] Failed to write audit log:', err.message)
  }
}
