import { Router } from 'express'
import * as csrController from '../controllers/csrController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { grantSchema, sponsorBookSchema } from '../validators/csrValidators.js'

const router = Router()

router.use(requireAuth, requireRole('csr_sponsor'))

router.get('/summary', csrController.getSummary)
router.get('/students', csrController.getStudents)
router.get('/sponsorable-books', csrController.getSponsorableBooks)
router.post('/grant', validate(grantSchema), csrController.grant)
router.post('/sponsor-book', validate(sponsorBookSchema), csrController.sponsorBook)

export default router
