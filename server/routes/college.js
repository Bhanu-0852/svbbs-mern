import { Router } from 'express'
import * as collegeController from '../controllers/collegeController.js'
import { requireAuth } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { validate } from '../middleware/validate.js'
import { scholarshipSchema } from '../validators/collegeValidators.js'

const router = Router()

router.use(requireAuth, requireRole('college_admin'))

router.get('/overview', collegeController.getOverview)
router.get('/students', collegeController.getStudents)
router.get('/demand-forecast', collegeController.getDemandForecast)
router.get('/scholarships', collegeController.getScholarshipHistory)
router.post('/scholarships', validate(scholarshipSchema), collegeController.awardScholarship)

export default router
