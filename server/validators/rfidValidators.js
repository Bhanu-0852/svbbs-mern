import Joi from 'joi'

export const registerTagSchema = Joi.object({
  bookId: Joi.string().hex().length(24).required(),
})

export const scanTagSchema = Joi.object({
  tagId: Joi.string().trim().min(4).max(64).required(),
})
