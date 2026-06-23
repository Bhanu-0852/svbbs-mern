import { Router } from 'express'
import * as rfidController from '../controllers/rfidController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { registerTagSchema, scanTagSchema } from '../validators/rfidValidators.js'

const router = Router()

router.use(requireAuth, requireRole('vendor'))

router.get('/tags', rfidController.getTags)
router.get('/stats', rfidController.getStats)
router.get('/history/:bookId', rfidController.getScanHistory)
router.post('/register', validate(registerTagSchema), rfidController.registerTag)
router.post('/scan', validate(scanTagSchema), rfidController.scanTag)

export default router
