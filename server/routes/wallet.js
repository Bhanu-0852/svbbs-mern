import { Router } from 'express'
import * as walletController from '../controllers/walletController.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/me', requireAuth, walletController.getWallet)
router.get('/transactions', requireAuth, walletController.getTransactions)
router.get('/my-books', requireAuth, walletController.getMyBooks)
router.post('/borrow/:bookId', requireAuth, walletController.borrow)
router.post('/return/:bookId', requireAuth, walletController.returnBook)

export default router
