import { Router } from 'express'
import User from '../models/User.js'
import * as parentController from '../controllers/parentController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { requireOwnership } from '../middleware/ownership.js'
import { validate } from '../middleware/validate.js'
import { topUpSchema } from '../validators/parentValidators.js'

const router = Router()

router.use(requireAuth, requireRole('parent'))

router.get('/children', parentController.getChildren)

// A parent can only top up a student whose own parentId points back to
// them — deliberately narrower than the CSR sponsor, who can fund any
// student. super_admin is excluded from the bypass here (unlike the
// default), since there's no legitimate reason for an admin to spoof a
// parent-child wallet transfer.
router.post(
  '/topup',
  validate(topUpSchema),
  requireOwnership(
    async (req) => {
      const student = await User.findById(req.body.studentId).select('parentId')
      return student?.parentId
    },
    { allowRoles: [] }
  ),
  parentController.topUp
)

router.get(
  '/activity/:studentId',
  requireOwnership(
    async (req) => {
      const student = await User.findById(req.params.studentId).select('parentId')
      return student?.parentId
    },
    { allowRoles: [] }
  ),
  parentController.getActivity
)

export default router
