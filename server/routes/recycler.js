import { Router } from 'express'
import * as recyclerController from '../controllers/recyclerController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

router.use(requireAuth, requireRole('recycler'))

router.get('/candidates', recyclerController.getCandidates)
router.get('/recycled', recyclerController.getRecycled)
router.get('/stats', recyclerController.getStats)
router.get('/revenue', recyclerController.getRevenue)
router.post('/recycle/:bookId', recyclerController.recycle)

export default router
