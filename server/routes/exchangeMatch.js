import { Router } from 'express'
import * as controller from '../controllers/exchangeMatchController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Find the best exchange partners for a book the logged-in user owns.
router.get('/:bookId', requireAuth, controller.getMatches)

export default router