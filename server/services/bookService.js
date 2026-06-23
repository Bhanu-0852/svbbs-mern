import Book from '../models/Book.js'
import BookHistory from '../models/BookHistory.js'
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js'
import { fail } from '../utils/response.js'

export async function listBooks(query) {
  const { page, limit, skip } = parsePagination(query)
  const filter = {}

  if (query.q) {
    filter.$text = { $search: query.q }
  }
  if (query.category) {
    filter.categoryTags = query.category
  }
  if (query.exam) {
    filter.examTags = query.exam
  }
  filter.status = query.status || 'available' // default to browsable inventory only

  // Mongo doesn't allow mixing a $meta textScore projection with a field
  // exclusion projection in the same query, so the two modes branch here
  // rather than sharing one .select() call.
  let cursor
  if (query.q) {
    cursor = Book.find(filter, { score: { $meta: 'textScore' } }).sort({ score: { $meta: 'textScore' } })
  } else {
    cursor = Book.find(filter).select('-aiConditionReport').sort({ createdAt: -1 })
  }

  const [items, total] = await Promise.all([cursor.skip(skip).limit(limit), Book.countDocuments(filter)])

  return { items, pagination: buildPaginationMeta({ page, limit, total }) }
}

export async function listMyBooks(userId) {
  return Book.find({ currentHolderId: userId }).sort({ updatedAt: -1 })
}

export async function getBookById(id) {
  const book = await Book.findById(id).populate('ownerId', 'name role')
  if (!book) throw fail(404, 'Book not found.')

  const history = await BookHistory.find({ bookId: book._id }).sort({ createdAt: 1 })

  return { book, history }
}

export async function logScan(bookId, userId) {
  const book = await Book.findById(bookId).select('_id')
  if (!book) throw fail(404, 'Book not found.')

  return BookHistory.create({
    bookId: book._id,
    event: 'scanned',
    toUserId: userId || null,
    note: userId ? 'QR code scanned by a logged-in user.' : 'QR code scanned.',
  })
}
