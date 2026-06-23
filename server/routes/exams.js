import { Router } from 'express'
import * as examController from '../controllers/examController.js'

const router = Router()

router.get('/', examController.listExams)
router.get('/:code', examController.getExam)

export default router
