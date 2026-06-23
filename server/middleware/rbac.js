import { fail } from '../utils/response.js'

/**
 * Usage: router.get('/path', requireAuth, requireRole('vendor', 'super_admin'), handler)
 * Per spec §9.7: verified on every protected route, never relying on
 * frontend checks alone.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(fail(401, 'Authentication required.'))
    if (!allowedRoles.includes(req.user.role)) {
      return next(fail(403, 'You do not have permission to perform this action.'))
    }
    next()
  }
}
