import { Router } from 'express'
import * as chatbotController from '../controllers/chatbotController.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { sendMessageSchema } from '../validators/chatbotValidators.js'

const router = Router()

router.use(requireAuth)

router.get('/history', chatbotController.getHistory)
router.post('/message', validate(sendMessageSchema), chatbotController.sendMessage)
router.post('/explain', chatbotController.explainFeature)

export default router