import * as recyclerService from '../services/recyclerService.js'
import { ok } from '../utils/response.js'

export async function getCandidates(req, res, next) {
  try {
    const books = await recyclerService.getCandidates()
    ok(res, { books })
  } catch (err) {
    next(err)
  }
}

export async function getRecycled(req, res, next) {
  try {
    const books = await recyclerService.getRecycledBooks()
    ok(res, { books })
  } catch (err) {
    next(err)
  }
}

export async function getStats(req, res, next) {
  try {
    const stats = await recyclerService.getStats()
    ok(res, { stats })
  } catch (err) {
    next(err)
  }
}

export async function getRevenue(req, res, next) {
  try {
    const revenue = await recyclerService.getRevenue(req.user._id)
    ok(res, revenue)
  } catch (err) {
    next(err)
  }
}

export async function recycle(req, res, next) {
  try {
    const { book } = await recyclerService.recycleBook(req.params.bookId, req.user._id, req)
    ok(res, { book }, 'Book processed for recycling.')
  } catch (err) {
    next(err)
  }
}
