import { Router } from 'express'
import express from 'express'
import * as aiController from '../controllers/aiController.js'
import { requireAuth, attachUserIfPresent } from '../middleware/auth.js'

const router = Router()

router.post('/verify-book/:bookId', requireAuth, aiController.verifyBook)

// Photo verification needs a larger body limit for base64 images (~8MB)
router.post(
  '/verify-photo',
  requireAuth,
  express.json({ limit: '8mb' }),
  aiController.verifyBookPhoto
)

// Natural-language search — open to all
router.post('/search', attachUserIfPresent, aiController.naturalSearch)

// Reading difficulty analysis — open to all visitors deciding whether to borrow
router.post('/reading-difficulty', attachUserIfPresent, aiController.readingDifficulty)

// Book summary — open to all visitors
router.post('/book-summary', attachUserIfPresent, aiController.bookSummary)

// "Is this book right for me?" — open to all visitors
router.post('/ask-book', attachUserIfPresent, aiController.askAboutBook)

export default router