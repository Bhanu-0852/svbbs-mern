import * as aiService from '../services/aiService.js'
import { ok, fail } from '../utils/response.js'

export async function verifyBook(req, res, next) {
  try {
    const result = await aiService.verifyBookCondition(req.params.bookId)
    ok(res, { analysis: result })
  } catch (err) {
    next(err)
  }
}

// Photo-based verification — accepts a base64 image in the request body
export async function verifyBookPhoto(req, res, next) {
  try {
    const { image, mimeType, bookId } = req.body
    if (!image) throw fail(400, 'No image provided.')

    // Strip data URL prefix if present (data:image/jpeg;base64,...)
    const base64 = image.includes(',') ? image.split(',')[1] : image
    const type = mimeType || 'image/jpeg'

    const result = await aiService.verifyBookPhoto(base64, type, bookId || null)
    ok(res, { analysis: result })
  } catch (err) {
    next(err)
  }
}