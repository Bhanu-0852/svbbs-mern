import Joi from 'joi'

export const topUpSchema = Joi.object({
  studentId: Joi.string().hex().length(24).required(),
  kcAmount: Joi.number().integer().min(1).max(5000).required(),
})
