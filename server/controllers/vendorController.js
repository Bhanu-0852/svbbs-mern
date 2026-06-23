import * as vendorService from '../services/vendorService.js'
import { ok } from '../utils/response.js'

export async function getInventory(req, res, next) {
  try {
    const books = await vendorService.getInventory(req.user._id)
    ok(res, { books })
  } catch (err) {
    next(err)
  }
}

export async function getTransactions(req, res, next) {
  try {
    const transactions = await vendorService.getTransactions(req.user._id)
    ok(res, { transactions })
  } catch (err) {
    next(err)
  }
}

export async function getStats(req, res, next) {
  try {
    const stats = await vendorService.getStats(req.user._id)
    ok(res, { stats })
  } catch (err) {
    next(err)
  }
}
