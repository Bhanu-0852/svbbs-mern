import { Router } from 'express'
import * as controller from '../controllers/careerMentorController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/roadmap', requireAuth, controller.getRoadmap)

export default router