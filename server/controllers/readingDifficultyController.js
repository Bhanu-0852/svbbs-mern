import * as difficultyService from '../services/readingDifficultyService.js'
import { ok, fail } from '../utils/response.js'

export async function analyze(req, res, next) {
  try {
    const { title, author, categoryTags, examTags, description } = req.body
    if (!title) throw fail(400, 'A book title is required.')
    const result = await difficultyService.analyzeDifficulty({
      title,
      author,
      categoryTags,
      examTags,
      description,
    })
    ok(res, result)
  } catch (err) {
    next(err)
  }
}