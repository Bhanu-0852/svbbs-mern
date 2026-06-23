import { fail } from '../utils/response.js'

/**
 * Generic resource-ownership guard (spec §9.7: "a student can only act on
 * their own books/wallet"). Later slices use this like:
 *
 *   requireOwnership(async (req) => {
 *     const book = await Book.findById(req.params.id)
 *     return book?.ownerId?.toString()
 *   })
 *
 * `super_admin` and `college_admin` bypass ownership checks by default
 * since they legitimately act on others' resources — pass
 * { allowRoles: [] } to disable that for a specific route if needed.
 */
export function requireOwnership(getOwnerId, { allowRoles = ['super_admin'] } = {}) {
  return async (req, res, next) => {
    try {
      if (!req.user) return next(fail(401, 'Authentication required.'))
      if (allowRoles.includes(req.user.role)) return next()

      const ownerId = await getOwnerId(req)
      if (!ownerId) return next(fail(404, 'Resource not found.'))

      if (ownerId.toString() !== req.user._id.toString()) {
        return next(fail(403, 'You do not have access to this resource.'))
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}
