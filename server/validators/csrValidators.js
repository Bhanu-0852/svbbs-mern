import Joi from 'joi'

export const grantSchema = Joi.object({
  studentId: Joi.string().hex().length(24).required(),
  kcAmount: Joi.number().integer().min(1).max(5000).required(),
  note: Joi.string().trim().max(200).allow('').optional(),
})

export const sponsorBookSchema = Joi.object({
  studentId: Joi.string().hex().length(24).required(),
  bookId: Joi.string().hex().length(24).required(),
  note: Joi.string().trim().max(200).allow('').optional(),
})
