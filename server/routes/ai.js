import { Router } from 'express'
import express from 'express'
import * as aiController from '../controllers/aiController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.post('/verify-book/:bookId', requireAuth, aiController.verifyBook)

// Photo verification needs a larger body limit for base64 images (~8MB)
router.post(
  '/verify-photo',
  requireAuth,
  express.json({ limit: '8mb' }),
  aiController.verifyBookPhoto
)

export default router