import { Router } from 'express'
import * as sustainabilityController from '../controllers/sustainabilityController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', sustainabilityController.getImpact)
router.get('/me', requireAuth, sustainabilityController.getMyImpact)

export default router
