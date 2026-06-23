import { getOrCreateWallet } from '../services/kcWalletService.js'
import * as borrowService from '../services/borrowService.js'
import * as bookService from '../services/bookService.js'
import { checkDueReminders } from '../services/notificationService.js'
import Transaction from '../models/Transaction.js'
import { ok } from '../utils/response.js'

export async function getWallet(req, res, next) {
  try {
    const wallet = await getOrCreateWallet(req.user._id)
    ok(res, { balance: wallet.balance })
  } catch (err) {
    next(err)
  }
}

export async function getTransactions(req, res, next) {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .populate('bookId', 'title author coverImage')
      .sort({ createdAt: -1 })
      .limit(50)
    ok(res, { transactions })
  } catch (err) {
    next(err)
  }
}

export async function getMyBooks(req, res, next) {
  try {
    // Honest on-demand reminder check, not a background job — see
    // notificationService.checkDueReminders for why. This is the
    // natural trigger point: a student's dashboard always fetches their
    // currently-held books, so this runs whenever that happens.
    await checkDueReminders(req.user._id)
    const books = await bookService.listMyBooks(req.user._id)
    ok(res, { books })
  } catch (err) {
    next(err)
  }
}

export async function borrow(req, res, next) {
  try {
    const { book, transaction, walletBalance } = await borrowService.borrowBook(
      req.user._id,
      req.params.bookId,
      req
    )
    ok(res, { book, transaction, walletBalance }, 'Book borrowed successfully.')
  } catch (err) {
    next(err)
  }
}

export async function returnBook(req, res, next) {
  try {
    const { book } = await borrowService.returnBook(req.user._id, req.params.bookId, req)
    ok(res, { book }, 'Book returned. Thanks for keeping it in circulation.')
  } catch (err) {
    next(err)
  }
}
