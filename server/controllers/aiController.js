import * as aiService from '../services/aiService.js'
import * as aiSearchService from '../services/aiSearchService.js'
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

    const base64 = image.includes(',') ? image.split(',')[1] : image
    const type = mimeType || 'image/jpeg'

    const result = await aiService.verifyBookPhoto(base64, type, bookId || null)
    ok(res, { analysis: result })
  } catch (err) {
    next(err)
  }
}

// Natural-language book search — parses a plain-English query into filters
export async function naturalSearch(req, res, next) {
  try {
    const query = (req.body.query || req.query.query || '').trim()
    if (!query) throw fail(400, 'Please provide a search query.')

    const result = await aiSearchService.aiSearch(query)
    ok(res, result)
  } catch (err) {
    next(err)
  }
}