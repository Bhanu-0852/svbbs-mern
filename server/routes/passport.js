import { Router } from 'express'
import * as passportController from '../controllers/passportController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/me', requireAuth, passportController.getPassport)
router.get('/me/pdf', requireAuth, passportController.downloadPassportPdf)

export default router
