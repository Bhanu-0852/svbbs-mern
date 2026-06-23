import Joi from 'joi'
import { BOOK_CATEGORY_TAGS, BOOK_STATUSES } from '../models/Book.js'

export const listBooksQuerySchema = Joi.object({
  q: Joi.string().trim().max(100).allow('').optional(),
  category: Joi.string().valid(...BOOK_CATEGORY_TAGS).optional(),
  exam: Joi.string().trim().max(50).optional(),
  status: Joi.string().valid(...BOOK_STATUSES).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50).optional(),
})

export function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, { abortEarly: true, stripUnknown: true })
    if (error) {
      const err = new Error(error.details[0].message)
      err.statusCode = 400
      return next(err)
    }
    req.query = value
    next()
  }
}
