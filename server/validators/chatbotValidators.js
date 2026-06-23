import Joi from 'joi'

export const sendMessageSchema = Joi.object({
  message: Joi.string().trim().min(1).max(500).required(),
})
