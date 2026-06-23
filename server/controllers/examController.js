import Book from '../models/Book.js'
import { EXAM_CATEGORIES, getExamByCode } from '../data/examCategories.js'
import { ok, fail } from '../utils/response.js'

export async function listExams(req, res, next) {
  try {
    const counts = await Book.aggregate([
      { $match: { status: 'available' } },
      { $unwind: '$examTags' },
      { $group: { _id: '$examTags', count: { $sum: 1 } } },
    ])
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]))

    const exams = EXAM_CATEGORIES.map((e) => ({
      ...e,
      availableCount: countMap[e.code] || 0,
    }))

    ok(res, { exams })
  } catch (err) {
    next(err)
  }
}

export async function getExam(req, res, next) {
  try {
    const exam = getExamByCode(req.params.code)
    if (!exam) throw fail(404, 'Exam category not found.')

    const availableCount = await Book.countDocuments({ examTags: exam.code, status: 'available' })

    ok(res, { exam: { ...exam, availableCount } })
  } catch (err) {
    next(err)
  }
}
