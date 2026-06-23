import Joi from 'joi'
import { BOOK_CONDITIONS, BOOK_CATEGORY_TAGS } from '../models/Book.js'

export const depositBookSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  author: Joi.string().trim().min(1).max(150).required(),
  isbn: Joi.string().trim().min(8).max(20).required(),
  edition: Joi.string().trim().max(50).allow('').optional(),
  description: Joi.string().trim().max(500).allow('').optional(),
  condition: Joi.string().valid(...BOOK_CONDITIONS).required(),
  categoryTags: Joi.array().items(Joi.string().valid(...BOOK_CATEGORY_TAGS)).min(1).required(),
  examTags: Joi.array().items(Joi.string().trim().max(20)).optional(),
  depositMethod: Joi.string().valid('deposit', 'donate', 'exchange', 'sell').required(),
  salePrice: Joi.number().integer().min(1).max(100000).when('depositMethod', {
    is: 'sell',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
})

export const proposeExchangeSchema = Joi.object({
  offeredBookId: Joi.string().hex().length(24).required(),
})

export const respondExchangeSchema = Joi.object({
  accept: Joi.boolean().required(),
})
