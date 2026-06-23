import { Router } from 'express'
import * as bookController from '../controllers/bookController.js'
import * as waitlistController from '../controllers/waitlistController.js'
import * as depositController from '../controllers/depositController.js'
import { validateQuery, listBooksQuerySchema } from '../validators/bookValidators.js'
import { depositBookSchema, proposeExchangeSchema } from '../validators/depositValidators.js'
import { validate } from '../middleware/validate.js'
import { attachUserIfPresent, requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

router.get('/', validateQuery(listBooksQuerySchema), bookController.listBooks)
// Must be registered before '/:id' — Express matches in registration
// order, so 'recommendations'/'mine' would otherwise be captured as the
// :id param.
router.get('/recommendations', requireAuth, bookController.getBookRecommendations)
router.get('/mine', requireAuth, requireRole('student'), depositController.getMyListings)
router.post('/', requireAuth, requireRole('student'), validate(depositBookSchema), depositController.depositBook)
router.get('/:id', bookController.getBook)
router.get('/:id/qrcode', bookController.getQrCode)
router.post('/:id/scan', attachUserIfPresent, bookController.logScan)
router.get('/:id/waitlist', requireAuth, waitlistController.getStatus)
router.post('/:id/waitlist', requireAuth, waitlistController.join)
router.delete('/:id/waitlist', requireAuth, waitlistController.leave)
router.post('/:id/buy', requireAuth, requireRole('student'), depositController.buyBook)
router.post(
  '/:id/exchange-propose',
  requireAuth,
  requireRole('student'),
  validate(proposeExchangeSchema),
  depositController.proposeExchange
)

export default router
