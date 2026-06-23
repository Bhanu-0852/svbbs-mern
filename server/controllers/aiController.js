import * as aiService from '../services/aiService.js'
import { ok } from '../utils/response.js'

export async function verifyBook(req, res, next) {
  try {
    const result = await aiService.verifyBookCondition(req.params.bookId)
    ok(res, { analysis: result })
  } catch (err) {
    next(err)
  }
}
