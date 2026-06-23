import { comparePassword } from '../utils/hash.js'
import { fail } from '../utils/response.js'
import User from '../models/User.js'

/**
 * Per spec §9.6: "step-up authentication for critical actions" — wallet
 * payouts, role changes, MFA disable, large KC transfers, etc. Later
 * slices apply this on top of requireAuth, e.g.:
 *
 *   router.post('/wallet/payout', requireAuth, requireStepUp, handler)
 *
 * The client re-prompts for the current password and sends it as
 * `confirmPassword` in the request body. req.user from requireAuth has
 * the password field stripped, so this re-fetches it with the hash.
 */
export async function requireStepUp(req, res, next) {
  try {
    const { confirmPassword } = req.body
    if (!confirmPassword) {
      return next(fail(400, 'Please confirm your password to continue.'))
    }

    const fullUser = await User.findById(req.user._id).select('passwordHash')
    const ok = await comparePassword(confirmPassword, fullUser.passwordHash)
    if (!ok) return next(fail(401, 'Incorrect password.'))

    next()
  } catch (err) {
    next(err)
  }
}
