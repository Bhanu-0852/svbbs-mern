import { Router } from 'express'
import * as depositController from '../controllers/depositController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { respondExchangeSchema } from '../validators/depositValidators.js'

const router = Router()

router.use(requireAuth, requireRole('student'))

router.get('/mine', depositController.getMyExchangeProposals)
router.post('/:id/respond', validate(respondExchangeSchema), depositController.respondToExchange)

export default router
