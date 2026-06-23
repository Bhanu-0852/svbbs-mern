import { fail } from '../utils/response.js'

/**
 * Usage: router.post('/path', validate(schema), handler)
 * Validates req.body against a Joi schema; on failure, returns a generic
 * 400 with the first message (server-side validation always runs,
 * regardless of what the frontend already checked — spec §9.9).
 */
export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: true, stripUnknown: true })
    if (error) {
      return next(fail(400, error.details[0].message))
    }
    req.body = value
    next()
  }
}
