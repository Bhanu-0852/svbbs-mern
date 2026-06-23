import { Router } from 'express'
import * as notificationController from '../controllers/notificationController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

router.get('/', notificationController.list)
router.post('/read-all', notificationController.markAllRead)
router.post('/:id/read', notificationController.markRead)

export default router
