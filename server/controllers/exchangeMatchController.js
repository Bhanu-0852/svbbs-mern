import * as matchService from '../services/exchangeMatchService.js'
import { ok, fail } from '../utils/response.js'

export async function getMatches(req, res, next) {
  try {
    const { bookId } = req.params
    if (!bookId) throw fail(400, 'A bookId is required.')
    let result = await matchService.findMatches(bookId, req.user._id)
    result = await matchService.enhanceTopMatchReason(result)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}