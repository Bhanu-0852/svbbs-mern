import { Router } from 'express'
import * as superAdminController from '../controllers/superAdminController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

const router = Router()

router.use(requireAuth, requireRole('super_admin'))

router.get('/stats', superAdminController.getStats)
router.get('/audit-logs', superAdminController.getAuditLogs)
router.get('/fraud-signals', superAdminController.getFraudSignals)

export default router
