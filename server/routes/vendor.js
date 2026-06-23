import { Router } from 'express'
import * as vendorController from '../controllers/vendorController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

router.use(requireAuth, requireRole('vendor'))

router.get('/inventory', vendorController.getInventory)
router.get('/transactions', vendorController.getTransactions)
router.get('/stats', vendorController.getStats)

export default router
