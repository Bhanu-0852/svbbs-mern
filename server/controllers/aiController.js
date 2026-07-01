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

// AI book summary — generates a quick summary of a book before borrowing
export async function bookSummary(req, res, next) {
  try {
    const { title, author, categoryTags, description } = req.body
    if (!title || !author) throw fail(400, 'title and author are required.')
    const { generateBookSummary } = await import('../services/bookSummaryService.js')
    const result = await generateBookSummary({ title, author, categoryTags, description })
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

// "Is this book right for me?" — answers a student's question about a book
export async function askAboutBook(req, res, next) {
  try {
    const { question, title, author, categoryTags, examTags, description } = req.body
    if (!question || !title) throw fail(400, 'question and title are required.')
    const { askAboutBook: ask } = await import('../services/bookAdvisorService.js')
    const result = await ask({ question, title, author, categoryTags, examTags, description })
    ok(res, result)
  } catch (err) {
    next(err)
  }
}

// Reading difficulty analysis for a book
export async function readingDifficulty(req, res, next) {
  try {
    const { title, author, categoryTags, examTags, description } = req.body
    if (!title) throw fail(400, 'A book title is required.')
    const { analyzeDifficulty } = await import('../services/readingDifficultyService.js')
    const result = await analyzeDifficulty({ title, author, categoryTags, examTags, description })
    ok(res, result)
  } catch (err) {
    next(err)
  }
}