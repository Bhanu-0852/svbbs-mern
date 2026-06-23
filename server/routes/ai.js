import { Router } from 'express'
import * as aiController from '../controllers/aiController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/verify-book/:bookId', requireAuth, aiController.verifyBook)

export default router
